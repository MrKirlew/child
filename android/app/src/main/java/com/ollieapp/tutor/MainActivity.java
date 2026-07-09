package com.ollieapp.tutor;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SpeechPlugin.class);
        registerPlugin(GemmaPlugin.class);
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        webView.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);

        // Auto-grant WebView media permissions (Live voice mic) — but subclass Capacitor's
        // BridgeWebChromeClient so onShowFileChooser() is preserved. A bare WebChromeClient
        // has no file chooser, which silently broke Homework Helper's photo <input type=file>
        // (tapping "Add a page" did nothing). BridgeWebChromeClient keeps the picker + camera.
        webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
    }
}
