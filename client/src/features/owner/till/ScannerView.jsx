import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SCANNER_ELEMENT_ID = 'till-qr-scanner';

// Uses the imperative Html5Qrcode class so we control exactly when the camera
// stops - it must stop before the identify call fires, not after.
const ScannerView = ({ onResult }) => {
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    let isStopped = false;

    // Html5Qrcode.stop() throws synchronously (not a rejected promise) when
    // the scanner is already stopped or never finished starting, so a plain
    // .catch() can't catch it. The flag avoids the redundant call; try/catch
    // is the backstop for the sync throw.
    const stopScanner = async () => {
      if (isStopped) return;
      isStopped = true;
      try {
        await scanner.stop();
      } catch {
        // Already stopped - nothing to clean up.
      }
    };

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        (decodedText) => {
          if (isStopped) return;
          stopScanner().finally(() => onResult(decodedText));
        },
        () => {
          // Fires every frame with no code found - not an error, ignore.
        }
      )
      .catch(() => {
        isStopped = true;
        setCameraError(true);
      });

    return () => {
      stopScanner();
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

  return <div id={SCANNER_ELEMENT_ID} className="mx-auto w-full max-w-xs overflow-hidden rounded-card" />;
};

export default ScannerView;
