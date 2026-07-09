import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Regression guards for the Homework Helper photo picker on Android.
//
// Bug (fixed): MainActivity replaced Capacitor's BridgeWebChromeClient with a bare
// android.webkit.WebChromeClient (to auto-grant the Live-voice mic). A bare
// WebChromeClient has no onShowFileChooser(), so every <input type=file> in the app
// — including "Add a page" in Homework Helper — silently did nothing (no picker, no
// camera, no intent). Fix: subclass BridgeWebChromeClient (keeps the file chooser)
// and declare the IMAGE_CAPTURE <queries> so the camera resolves under Android 11+
// package-visibility filtering. Verified on-device: "Add a page" now opens the camera
// and captured photos flow into the homework tray.

const mainActivity = readFileSync(
  new URL('../android/app/src/main/java/com/ollieapp/tutor/MainActivity.java', import.meta.url),
  'utf8'
);
const manifest = readFileSync(
  new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url),
  'utf8'
);

describe('Android Homework Helper file/camera picker (regression guard)', () => {
  it('MainActivity keeps Capacitor BridgeWebChromeClient (preserves onShowFileChooser)', () => {
    expect(mainActivity).toContain('import com.getcapacitor.BridgeWebChromeClient;');
    expect(mainActivity).toContain('new BridgeWebChromeClient(getBridge())');
  });

  it('MainActivity does NOT install a bare WebChromeClient (that would drop the file chooser)', () => {
    expect(mainActivity).not.toMatch(/new\s+WebChromeClient\s*\(\s*\)/);
  });

  it('AndroidManifest declares the IMAGE_CAPTURE query so the camera resolves (Android 11+ visibility)', () => {
    expect(manifest).toMatch(/<queries>[\s\S]*android\.media\.action\.IMAGE_CAPTURE[\s\S]*<\/queries>/);
  });

  it('still auto-grants WebView media permission for the Live-voice mic', () => {
    expect(mainActivity).toContain('onPermissionRequest');
    expect(mainActivity).toContain('request.grant(request.getResources())');
  });
});
