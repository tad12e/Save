package com.save.app.save_mobile

import android.content.Context
import android.content.Intent
import android.media.MediaRecorder
import android.os.Build
import android.os.Bundle
import android.util.Base64
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.android.FlutterActivityLaunchConfigs
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import org.json.JSONObject

/**
 * Dedicated share-target overlay.
 *
 * Why this exists: previously ACTION_SEND was handled by MainActivity
 * (singleTask, launcher affinity). Android therefore brought the full
 * Clipper task to the foreground, yanking the user out of Instagram /
 * TikTok / YouTube into the Clipper app.
 *
 * This activity runs as a separate translucent singleInstance task.
 * IN AUTO MODE: It finishes IMMEDIATELY in 0ms (no Flutter engine, no window,
 * zero overlay on top of Instagram) and executes background save with a native system Toast!
 * IN CONFIRM / ALWAYS ASK MODE: It renders the interactive bottom-sheet over Instagram.
 */
class ShareHandlerActivity : FlutterActivity() {
    override fun getBackgroundMode(): FlutterActivityLaunchConfigs.BackgroundMode {
        return FlutterActivityLaunchConfigs.BackgroundMode.transparent
    }

    private val CHANNEL = "com.save.app/sharing"
    private var sharedData: String? = null
    private var isAudioRecognitionTriggered: Boolean = false
    private var methodChannel: MethodChannel? = null
    private var musicRecorder: MediaRecorder? = null
    private var musicCapturePath: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        overridePendingTransition(0, 0)
        handleIntent(intent)
        val dataToShare = sharedData

        if (!dataToShare.isNullOrBlank()) {
            val prefs = getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
            val mode = prefs.getString("flutter.clipper_confirmation_mode", "confirm")

            if ("auto" == mode) {
                // Fulfill Android OS lifecycle requirement
                super.onCreate(savedInstanceState)
                // Immediately finish activity in 0ms so ZERO UI or window ever draws over Instagram
                finish()
                overridePendingTransition(0, 0)

                val token = prefs.getString("flutter.auth_access_token", null)
                val savedBaseUrl = prefs.getString("flutter.api_base_url", null)
                val defaultDestId = prefs.getString("flutter.clipper_default_dest_id", null)
                val baseUrl = if (!savedBaseUrl.isNullOrBlank()) savedBaseUrl else "http://10.0.2.2:8000"

                // Fast background save on daemon thread
                performAutoSaveNative(dataToShare, token, baseUrl, defaultDestId)
                return
            }
        }

        super.onCreate(savedInstanceState)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
        val dataToShare = sharedData

        if (!dataToShare.isNullOrBlank()) {
            val prefs = getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
            val mode = prefs.getString("flutter.clipper_confirmation_mode", "confirm")

            if ("auto" == mode) {
                finish()
                overridePendingTransition(0, 0)

                val token = prefs.getString("flutter.auth_access_token", null)
                val savedBaseUrl = prefs.getString("flutter.api_base_url", null)
                val defaultDestId = prefs.getString("flutter.clipper_default_dest_id", null)
                val baseUrl = if (!savedBaseUrl.isNullOrBlank()) savedBaseUrl else "http://10.0.2.2:8000"

                performAutoSaveNative(dataToShare, token, baseUrl, defaultDestId)
                return
            }
        }

        sharedData?.let { data ->
            methodChannel?.invokeMethod("onSharedData", data)
        }
        if (isAudioRecognitionTriggered) {
            isAudioRecognitionTriggered = false
            methodChannel?.invokeMethod("onTriggerAudioRecognition", null)
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        methodChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
        methodChannel?.setMethodCallHandler { call, result ->
            when (call.method) {
                "getSharedData" -> {
                    result.success(sharedData)
                }
                "clearSharedData" -> {
                    sharedData = null
                    result.success(true)
                }
                "checkPendingAudioRecognition" -> {
                    val pending = isAudioRecognitionTriggered
                    isAudioRecognitionTriggered = false
                    result.success(pending)
                }
                "showToast" -> {
                    val message = call.argument<String>("message") ?: "Saved to Clipper"
                    android.widget.Toast.makeText(applicationContext, message, android.widget.Toast.LENGTH_SHORT).show()
                    result.success(true)
                }
                "closeShareOverlay" -> {
                    // Called from Flutter after save / dismiss so we return
                    // instantly to the source app (Instagram, etc.).
                    sharedData = null
                    finish()
                    // Suppress exit animation — feels like dismissing a sheet.
                    overridePendingTransition(0, 0)
                    result.success(true)
                }
                "startMusicCapture" -> {
                    result.success(startMusicCapture())
                }
                "stopMusicCapture" -> {
                    result.success(stopMusicCapture())
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(0, 0)
    }

    // ─── Music Radar: 5s mic capture via platform MediaRecorder ───
    // No Flutter plugin needed; returns a base64 data URL or null when
    // the mic is unavailable/denied (Dart falls back to link-hint match).
    private fun startMusicCapture(): Boolean {
        stopMusicCaptureInternal()
        return try {
            val outFile = File.createTempFile("clipper_music_", ".m4a", cacheDir)
            val rec = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(this)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }
            rec.setAudioSource(MediaRecorder.AudioSource.MIC)
            rec.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            rec.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            rec.setAudioSamplingRate(44100)
            rec.setAudioEncodingBitRate(128000)
            rec.setOutputFile(outFile.absolutePath)
            rec.prepare()
            rec.start()
            musicRecorder = rec
            musicCapturePath = outFile.absolutePath
            true
        } catch (e: Exception) {
            stopMusicCaptureInternal()
            false
        }
    }

    private fun stopMusicCapture(): String? {
        val path = musicCapturePath
        stopMusicCaptureInternal()
        if (path == null) return null
        return try {
            val bytes = File(path).readBytes()
            try { File(path).delete() } catch (e: Exception) {}
            if (bytes.isEmpty()) null
            else "data:audio/m4a;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
        } catch (e: Exception) {
            null
        }
    }

    private fun stopMusicCaptureInternal() {
        try {
            musicRecorder?.apply {
                try { stop() } catch (e: Exception) {}
                try { release() } catch (e: Exception) {}
            }
        } catch (e: Exception) {}
        musicRecorder = null
    }

    private fun handleIntent(intent: Intent?) {
        if (intent == null) return

        val action = intent.action
        val type = intent.type

        if ("com.save.app.ACTION_RECOGNIZE_AUDIO" == action) {
            isAudioRecognitionTriggered = true
            return
        }

        if (Intent.ACTION_SEND == action && type != null) {
            if ("text/plain" == type || type.startsWith("text/") || "*/*" == type) {
                val text = intent.getStringExtra(Intent.EXTRA_TEXT)
                if (!text.isNullOrBlank()) {
                    sharedData = text
                    return
                }

                // Fallback to ClipData
                intent.clipData?.let { clipData ->
                    if (clipData.itemCount > 0) {
                        val item = clipData.getItemAt(0)
                        val clipText = item.text?.toString() ?: item.uri?.toString()
                        if (!clipText.isNullOrBlank()) {
                            sharedData = clipText
                            return
                        }
                    }
                }
            }
            // Also accept a stream URI being shared (e.g. image/video share)
            if (Intent.ACTION_SEND == action) {
                intent.getParcelableExtra<android.os.Parcelable>(Intent.EXTRA_STREAM)?.let { stream ->
                    sharedData = stream.toString()
                    return
                }
            }
        } else if (Intent.ACTION_SEND_MULTIPLE == action) {
            // Take the first text item; full multi-share handled later.
            intent.getStringExtra(Intent.EXTRA_TEXT)?.let { text ->
                if (text.isNotBlank()) {
                    sharedData = text
                    return
                }
            }
            intent.clipData?.let { clipData ->
                if (clipData.itemCount > 0) {
                    val item = clipData.getItemAt(0)
                    val clipText = item.text?.toString() ?: item.uri?.toString()
                    if (!clipText.isNullOrBlank()) {
                        sharedData = clipText
                    }
                }
            }
        } else if (Intent.ACTION_VIEW == action) {
            intent.dataString?.let { uriString ->
                if (uriString.isNotBlank()) {
                    sharedData = uriString
                }
            }
        }
    }

    private fun formatDestinationName(id: String?): String {
        if (id.isNullOrBlank() || id == "google_sheets") return "Google Sheets"
        if (id == "notion") return "Notion"
        if (id == "spotify") return "Spotify"
        if (id == "vault") return "Vault"
        return id.replace('_', ' ').replaceFirstChar { it.uppercase() }
    }

    private fun performAutoSaveNative(rawText: String, token: String?, baseUrl: String, defaultDestId: String?) {
        Thread {
            try {
                val urlRegex = Regex("""(https?://[^\s]+)""", RegexOption.IGNORE_CASE)
                val match = urlRegex.find(rawText)
                var extractedUrl = if (match != null) match.value else rawText.trim()
                if (extractedUrl.endsWith(")") || extractedUrl.endsWith(".") || extractedUrl.endsWith(",")) {
                    extractedUrl = extractedUrl.substring(0, extractedUrl.length - 1)
                }
                val note = if (match != null) rawText.replace(extractedUrl, "").trim() else ""

                val cleanBaseUrl = baseUrl.trimEnd('/')
                val endpoint = URL("$cleanBaseUrl/api/v1/clips/")
                val conn = endpoint.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.connectTimeout = 8000
                conn.readTimeout = 8000
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                conn.setRequestProperty("Accept", "application/json")
                if (!token.isNullOrBlank()) {
                    conn.setRequestProperty("Authorization", "Bearer $token")
                }
                conn.doOutput = true

                val jsonPayload = JSONObject().apply {
                    put("url", extractedUrl)
                    put("selected_text", note)
                    if (!defaultDestId.isNullOrBlank()) {
                        put("destination_id", defaultDestId)
                    }
                    put("privacy_mode", false)
                }

                conn.outputStream.use { os ->
                    val input = jsonPayload.toString().toByteArray(StandardCharsets.UTF_8)
                    os.write(input, 0, input.size)
                }

                val statusCode = conn.responseCode
                val responseText = if (statusCode in 200..299) {
                    conn.inputStream.bufferedReader().use { it.readText() }
                } else {
                    conn.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                }

                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    if (statusCode in 200..299) {
                        var duplicate = false
                        var destName: String? = null
                        try {
                            val respObj = JSONObject(responseText)
                            duplicate = respObj.optBoolean("duplicate", false)
                            destName = respObj.optString("destination_name", null)
                        } catch (_: Exception) {}

                        val label = if (!destName.isNullOrBlank()) destName else formatDestinationName(defaultDestId)
                        val msg = if (duplicate) "⚡ Clipper: Already in $label" else "⚡ Clipper: Saved to $label!"
                        android.widget.Toast.makeText(applicationContext, msg, android.widget.Toast.LENGTH_SHORT).show()
                    } else if (statusCode == 401) {
                        android.widget.Toast.makeText(applicationContext, "⚡ Clipper: Please open app & sign in", android.widget.Toast.LENGTH_LONG).show()
                    } else {
                        android.widget.Toast.makeText(applicationContext, "⚡ Clipper: Save failed ($statusCode)", android.widget.Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    android.widget.Toast.makeText(applicationContext, "⚡ Clipper: Connection error", android.widget.Toast.LENGTH_SHORT).show()
                }
            }
        }.start()
    }
}
