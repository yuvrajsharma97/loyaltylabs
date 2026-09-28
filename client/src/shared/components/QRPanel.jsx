import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Badge from './Badge';
import Modal from './Modal';

// The QR token is permanent (HMAC-signed, no rotation) - "Live" just means
// this is the customer's current active code, not a countdown to refresh.
const QRPanel = ({ qrToken }) => {
  const [isEnlarged, setIsEnlarged] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsEnlarged(true)}
        className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface p-6"
      >
        <QRCodeSVG value={qrToken} size={180} fgColor="#1C1F16" bgColor="#FFFFFF" />
        <Badge tone="success">Live</Badge>
      </button>

      <Modal isOpen={isEnlarged} onClose={() => setIsEnlarged(false)} title="Your code">
        <div className="flex flex-col items-center gap-4 py-2">
          <QRCodeSVG value={qrToken} size={260} fgColor="#1C1F16" bgColor="#FFFFFF" />
          <p className="text-body-sm text-text-secondary">Show this to the till to earn or redeem points.</p>
        </div>
      </Modal>
    </>
  );
};

export default QRPanel;
