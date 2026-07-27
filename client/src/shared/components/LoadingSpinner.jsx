import { PuffLoader } from 'react-spinners';

// Single loading indicator used everywhere in the app - icon only, no text.
// Color is `var(--color-primary)` - a real CSS custom property, not a
// hardcoded hex - so it resolves to whichever theme (light/dark) is active
// on <html> and updates automatically on toggle, no theme hook subscription
// needed here. Size is viewport-relative (vw) with min/max clamps via
// cssOverride, so it scales continuously across screen sizes instead of
// jumping between two fixed breakpoints. The spinner is wrapped in its own
// dedicated flex-centering box (both axes) rather than relying on the outer
// wrapper alone, since PuffLoader's own root element inherits its parent's
// `display` and otherwise doesn't reliably center itself.
export default function LoadingSpinner({ fullScreen = false }) {
  const wrapperClass = fullScreen
    ? 'min-h-screen w-full flex items-center justify-center bg-background px-container-margin'
    : 'w-full flex items-center justify-center py-2xl px-container-margin';

  const sizeProps = fullScreen
    ? { size: '10vw', cssOverride: { minWidth: 40, maxWidth: 72, minHeight: 40, maxHeight: 72 } }
    : { size: '7vw', cssOverride: { minWidth: 24, maxWidth: 44, minHeight: 24, maxHeight: 44 } };

  return (
    <div className={wrapperClass}>
      <div className="flex items-center justify-center">
        <PuffLoader color="var(--color-primary)" {...sizeProps} />
      </div>
    </div>
  );
}
