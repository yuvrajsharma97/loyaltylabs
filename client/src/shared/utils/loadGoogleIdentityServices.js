// Lazily injects Google Identity Services (only the sign-in page needs it,
// so it's not worth a static <script> tag in index.html on every page load).
// Cached as a module-level promise so concurrent/repeat callers share one
// script tag and one load instead of racing to inject it multiple times.
let loadPromise = null;

export function loadGoogleIdentityServices() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Could not load Google sign-in'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
