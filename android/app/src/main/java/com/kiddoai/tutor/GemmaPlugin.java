package com.kiddoai.tutor;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * GemmaPlugin — placeholder for future on-device Gemma 4 E2B inference.
 * Currently reports not-ready so the JS layer uses Google AI cloud API fallback.
 * On-device via ML Kit GenAI requires Kotlin integration (GenerativeModel is abstract in Java).
 */
@CapacitorPlugin(name = "GemmaPlugin")
public class GemmaPlugin extends Plugin {

    private static final String TAG = "KiddoAI-Gemma";

    @Override
    public void load() {
        Log.w(TAG, "GemmaPlugin loaded (cloud-only mode — on-device coming soon)");
    }

    @PluginMethod
    public void generate(PluginCall call) {
        // On-device not yet implemented — reject so JS falls through to cloud API
        call.reject("On-device model not available — using cloud fallback");
    }

    @PluginMethod
    public void isReady(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ready", false);
        call.resolve(ret);
    }
}
