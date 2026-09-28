import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

let scannerCount = 0;

// Uses the imperative Html5Qrcode class so we control exactly when the camera
// stops - it must stop before the identify call fires, not after.
//
// Two things make teardown tricky, and both caused a second live camera feed:
//  - React StrictMode (dev) mounts, unmounts and re-mounts every component, so
//    a first scanner is torn down while its camera is still starting.
//  - stop() only works once start() has resolved; calling it earlier throws,
//    and the camera then finishes starting with nothing left to stop it.
// So each mount renders into its own child element, and cleanup waits for
// start() to settle before stopping the camera and removing that element.
const ScannerView = ({ onResult }) => {
  const containerRef = useRef(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const element = document.createElement('div');
    element.id = `till-qr-scanner-${(scannerCount += 1)}`;
    container.appendChild(element);

    const scanner = new Html5Qrcode(element.id, { verbose: false });
    let isDone = false; // a code was read, or the component unmounted

    const startPromise = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        (decodedText) => {
          if (isDone) return;
          isDone = true;
          shutDown().then(() => onResult(decodedText));
        },
        () => {
          // Fires every frame with no code found - not an error, ignore.
        }
      )
      .catch(() => {
        if (!isDone) setCameraError(true);
      });

    // Safe to call at any point: waits for start() to settle before stopping.
    let shutDownPromise = null;
    function shutDown() {
      shutDownPromise ??= startPromise.then(async () => {
        try {
          if (scanner.isScanning) await scanner.stop();
        } catch {
          // Already stopped.
        }
        // Backstop: release any camera track still attached to the video, in
        // case the library bailed out after opening the camera.
        element.querySelector('video')?.srcObject?.getTracks().forEach((track) => track.stop());
        try {
          scanner.clear();
        } catch {
          // Nothing rendered to clear.
        }
      });
      return shutDownPromise;
    }

    return () => {
      isDone = true;
      // Hide it straight away but keep its size - with display:none the
      // library measures 0px, fails to start after already opening the camera,
      // and never releases it.
      element.style.cssText = 'position:absolute;inset:0;opacity:0;pointer-events:none';
      shutDown().finally(() => element.remove());
    };
    // onResult identity changing shouldn't restart the camera stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cameraError) {
    return (
      <p className="rounded-card border border-border bg-surface p-4 text-body-sm text-error-text">
        Camera access was denied or no camera was found. Use manual entry instead.
      </p>
    );
  }

  return <div ref={containerRef} className="relative mx-auto w-full max-w-xs overflow-hidden rounded-card" />;
};

export default ScannerView;
