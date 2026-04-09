package com.kiddoai.tutor;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SpeechPlugin.class);
        registerPlugin(GemmaPlugin.class);
        super.onCreate(savedInstanceState);
        getBridge().getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    }
}
