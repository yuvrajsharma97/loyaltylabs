import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { loadGoogleIdentityServices } from '../utils/loadGoogleIdentityServices';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Google Identity Services requires its own real button element to receive
// the click (a JS-triggered .click() on it is blocked) - so the actual GIS
// button is rendered here but kept invisible and stretched to fill this
// container, sitting on top of our own styled button underneath. The user
// sees our styling; the click that actually lands is Google's.
export default function GoogleSignInButton({ onCredential, disabled }) {
  const wrapperRef = useRef(null);
  const gisContainerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGoogleIdentityServices()
      .then((google) => {
        if (cancelled || !gisContainerRef.current) return;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => onCredential(response.credential)
        });
        google.accounts.id.renderButton(gisContainerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: Math.min(400, Math.round(wrapperRef.current?.offsetWidth || 400))
        });
        setReady(true);
      })
      .catch((err) => toast.error(err.message));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) return null;

  return (
    <div ref={wrapperRef} className="relative w-full h-[44px]">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        className="w-full h-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg flex items-center justify-center gap-md pointer-events-none"
      >
        <span className="font-body text-body-md font-medium">Continue with Google</span>
      </button>
      <div
        ref={gisContainerRef}
        className={`absolute inset-0 overflow-hidden rounded-lg opacity-0 ${ready && !disabled ? '' : 'pointer-events-none'}`}
      />
    </div>
  );
}
