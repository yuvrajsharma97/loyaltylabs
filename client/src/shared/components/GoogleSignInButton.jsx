import { useEffect, useRef } from 'react';
import { loadGoogleIdentityServices } from '../utils/loadGoogleIdentityServices';

// Google Sign-In is customer-only - store owners and admins are local
// email+password accounts (see backend/src/features/auth). Never render
// this on the owner/admin sign-in pages.
const GoogleSignInButton = ({ onCredential }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    loadGoogleIdentityServices().then((google) => {
      if (isCancelled || !buttonRef.current) return;

      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });
      google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [onCredential]);

  return <div ref={buttonRef} />;
};

export default GoogleSignInButton;
