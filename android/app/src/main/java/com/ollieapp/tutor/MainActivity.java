package com.ollieapp.tutor;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SpeechPlugin.class);
        registerPlugin(GemmaPlugin.class);
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        webView.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);

        // Auto-grant WebView media permissions when native RECORD_AUDIO is already granted
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
    }
}
