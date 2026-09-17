package com.save.app.save_mobile

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

/**
 * Dedicated share-target overlay.
 *
 * Why this exists: previously ACTION_SEND was handled by MainActivity
 * (singleTask, launcher affinity). Android therefore brought the full
 * Clipper task to the foreground, yanking the user out of Instagram /
 * TikTok / YouTube into the Clipper app.
 *
 * This activity instead runs as a separate translucent singleInstance task
 * (see AndroidManifest) rendered on TOP of the source app. Instagram stays
 * visible underneath, our Flutter bottom-sheet draws over it, and finish()
 * drops the user straight back where they were — no app-switch.
 */
class ShareHandlerActivity : FlutterActivity() {
    override fun getBackgroundMode(): FlutterActivityLaunchConfigs.BackgroundMode {
        return FlutterActivityLaunchConfigs.BackgroundMode.transparent
    }

    private val CHANNEL = "com.save.app/sharing"
    private var sharedData: String? = null
    private var methodChannel: MethodChannel? = null
    private var musicRecorder: MediaRecorder? = null
    private var musicCapturePath: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        // Render over the calling app with no enter animation so it feels
        // like a bottom-sheet inside Instagram, not an app launch.
        overridePendingTransition(0, 0)
        super.onCreate(savedInstanceState)
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
        sharedData?.let { data ->
            methodChannel?.invokeMethod("onSharedData", data)
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
                    result.success(false)
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
}
