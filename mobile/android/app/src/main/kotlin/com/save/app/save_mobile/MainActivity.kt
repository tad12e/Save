package com.save.app.save_mobile

import android.content.Intent
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.save.app/sharing"
    private var sharedData: String? = null
    private var isAudioRecognitionTriggered: Boolean = false
    private var methodChannel: MethodChannel? = null

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
                else -> {
                    result.notImplemented()
                }
            }
        }
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
            if ("text/plain" == type || type.startsWith("text/")) {
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
        } else if (Intent.ACTION_VIEW == action) {
            intent.dataString?.let { uriString ->
                if (uriString.isNotBlank()) {
                    sharedData = uriString
                }
            }
        }
    }
}
