import { useEffect } from 'react';
import IconButton from './IconButton';
import Icon from './Icon';

// One component, two appearances: a bottom sheet on mobile (<960px) and a
// centered dialog on desktop (>=960px) - same open/close contract either
// way. Chrome elsewhere on the page should flatten to opaque while this is
// open so glass layers never compound (see each AppShell).
const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="glass-scrim absolute inset-0" onClick={onClose} />
      <div
        className={`glass-overlay absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-sheet border border-border p-6 shadow-sheet rail:inset-0 rail:m-auto rail:h-fit rail:max-w-md rail:rounded-card rail:shadow-dialog ${className}`}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-pill bg-border-strong rail:hidden" />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-section text-text-primary">{title}</h2>
            <IconButton label="Close" onClick={onClose}>
              <Icon name="close" />
            </IconButton>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
