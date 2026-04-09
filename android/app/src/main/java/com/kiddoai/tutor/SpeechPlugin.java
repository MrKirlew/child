package com.kiddoai.tutor;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.Locale;

@CapacitorPlugin(
    name = "SpeechPlugin",
    permissions = { @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone") }
)
public class SpeechPlugin extends Plugin {

    private static final String TAG = "KiddoAI";
    private TextToSpeech tts;
    private SpeechRecognizer recognizer;
    private Handler mainHandler;

    @Override
    public void load() {
        mainHandler = new Handler(Looper.getMainLooper());
        Log.w(TAG, "SpeechPlugin loaded");

        tts = new TextToSpeech(getContext(), status -> {
            Log.w(TAG, "TTS init status: " + status);
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(Locale.US);
                tts.setPitch(1.15f);
                tts.setSpeechRate(0.95f);
            }
        });

        mainHandler.postDelayed(() -> {
            evalJS("window.IS_ANDROID=true;console.log('[KiddoAI] SpeechPlugin ready');");
        }, 300);
    }

    private void evalJS(String js) {
        mainHandler.post(() -> {
            try { bridge.getWebView().evaluateJavascript(js, null); }
            catch (Exception e) { Log.w(TAG, "evalJS error: " + e.getMessage()); }
        });
    }

    private Intent recognizerIntent() {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        return intent;
    }

    private void doStartRecognizer() {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            evalJS("onAndroidSpeechError()");
            return;
        }
        mainHandler.post(() -> {
            try {
                if (recognizer != null) { recognizer.destroy(); recognizer = null; }
                recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                recognizer.setRecognitionListener(new RecognitionListener() {
                    @Override public void onReadyForSpeech(Bundle p) { Log.w(TAG, "Listening..."); }
                    @Override public void onBeginningOfSpeech() {}
                    @Override public void onRmsChanged(float rmsdB) {}
                    @Override public void onBufferReceived(byte[] b) {}
                    @Override public void onEndOfSpeech() {}

                    @Override
                    public void onError(int error) {
                        Log.w(TAG, "Speech error: " + error);
                        evalJS("onAndroidSpeechError()");
                    }

                    @Override
                    public void onResults(Bundle results) {
                        ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                        String transcript = (matches != null && !matches.isEmpty()) ? matches.get(0) : "";
                        if (!transcript.isEmpty()) {
                            String escaped = transcript.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ");
                            evalJS("onAndroidSpeechResult('" + escaped + "')");
                        } else {
                            evalJS("onAndroidSpeechError()");
                        }
                    }

                    @Override public void onPartialResults(Bundle p) {}
                    @Override public void onEvent(int t, Bundle p) {}
                });
                recognizer.startListening(recognizerIntent());
            } catch (Exception e) {
                Log.w(TAG, "startRecognizer error: " + e.getMessage());
                evalJS("onAndroidSpeechError()");
            }
        });
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        if (tts == null || text.isEmpty()) { call.resolve(); return; }
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) {}
            @Override public void onDone(String id) { evalJS("onAndroidTTSDone()"); }
            @Override public void onError(String id) { evalJS("onAndroidTTSDone()"); }
        });
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ollie");
        call.resolve();
    }

    @PluginMethod
    public void stopSpeaking(PluginCall call) {
        if (tts != null) tts.stop();
        call.resolve();
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        Log.w(TAG, "startListening called");
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            Log.w(TAG, "Mic permission not granted — requesting");
            requestPermissionForAlias("microphone", call, "handleMicPermission");
            return;
        }
        doStartRecognizer();
        call.resolve();
    }

    @PermissionCallback
    private void handleMicPermission(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            Log.w(TAG, "Mic permission granted — starting recognizer");
            doStartRecognizer();
            call.resolve();
        } else {
            Log.w(TAG, "Mic permission denied by user");
            evalJS("onAndroidSpeechError('Please allow microphone access to use voice input')");
            call.reject("Microphone permission denied");
        }
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        mainHandler.post(() -> {
            if (recognizer != null) {
                try { recognizer.cancel(); } catch (Exception ignored) {}
            }
        });
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (recognizer != null) { recognizer.destroy(); }
        super.handleOnDestroy();
    }
}
