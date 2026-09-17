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

class MainActivity : FlutterActivity() {
    override fun getBackgroundMode(): FlutterActivityLaunchConfigs.BackgroundMode {
        // Main app is fully opaque. Share overlay lives in ShareHandlerActivity
        // so a share never lands here on fresh installs.
        return FlutterActivityLaunchConfigs.BackgroundMode.opaque
    }

    private val CHANNEL = "com.save.app/sharing"
    private var sharedData: String? = null
    private var isAudioRecognitionTriggered: Boolean = false
    private var methodChannel: MethodChannel? = null
    private var musicRecorder: MediaRecorder? = null
    private var musicCapturePath: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
        
        // Notify Flutter if engine is running
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
                "closeShareOverlay" -> {
                    // Share flow now lives in ShareHandlerActivity, but keep this
                    // for safety: just background instead of killing the main task.
                    sharedData = null
                    moveTaskToBack(true)
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

    private fun handleIntent(intent: Intent?) {
        if (intent == null) return

        val action = intent.action

        if ("com.save.app.ACTION_RECOGNIZE_AUDIO" == action) {
            isAudioRecognitionTriggered = true
            return
        }

        // NOTE: ACTION_SEND is deliberately NOT handled here. Shares go to
        // ShareHandlerActivity (translucent overlay over Instagram/TikTok).
        // Handling SEND here is what used to yank users into the full app.
    }

    // ─── Music Radar: 5s mic capture via platform MediaRecorder ───
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
}
