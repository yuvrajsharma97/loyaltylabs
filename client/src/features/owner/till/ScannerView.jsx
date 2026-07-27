import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const ELEMENT_ID = 'till-qr-scanner';

// Uses the imperative Html5Qrcode class (not Html5QrcodeScanner's built-in UI)
// so we control exactly when the camera stops - must stop() before the
// identify API call fires, not after, per the scan feature's Till Mode design.
export default function ScannerView({ onDecode, onError, onCancel }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = scanner;
    let stopped = false;

    // Html5Qrcode.stop() throws synchronously (not a rejected promise) when
    // called on an already-stopped scanner - a plain .catch() on its return
    // value can't catch that, since the throw happens before stop() returns
    // anything to chain onto. The `stopped` flag avoids the redundant call
    // altogether (decode callback stops it once; unmounting must not stop it
    // again), and try/catch is the backstop that actually catches a sync throw.
    const stopScanner = async () => {
      if (stopped) return;
      stopped = true;
      try {
        await scanner.stop();
      } catch {
        // Already stopped, or never finished starting - nothing to clean up.
      }
    };

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          if (stopped) return;
          stopScanner().finally(() => onDecode(decodedText));
        }
      )
      .catch((err) => {
        onError(err?.message || 'Could not access the camera');
      });

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-lg items-center">
      <div id={ELEMENT_ID} className="w-full max-w-[360px] rounded-xl overflow-hidden" />
      <button
        type="button"
        onClick={onCancel}
        className="font-body text-body-sm font-semibold text-on-surface-variant hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
