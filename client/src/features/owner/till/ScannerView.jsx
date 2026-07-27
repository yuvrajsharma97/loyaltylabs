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
    let decoded = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          if (decoded) return;
          decoded = true;
          scanner
            .stop()
            .catch(() => {})
            .finally(() => onDecode(decodedText));
        }
      )
      .catch((err) => {
        onError(err?.message || 'Could not access the camera');
      });

    return () => {
      scannerRef.current?.stop().catch(() => {});
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
