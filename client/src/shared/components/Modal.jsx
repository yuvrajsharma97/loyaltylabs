import Button from './Button';

// Generic confirm/cancel dialog - used for delete-reward, resolve-dispute,
// cancel-redemption, and redemption-confirm flows across both dashboards.
export default function Modal({
  open,
  title,
  children,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  onConfirm,
  confirming = false,
  onCancel,
  cancelText = 'Cancel'
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 px-container-margin">
      <div className="w-full max-w-[440px] max-h-[85vh] overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-xl flex flex-col gap-lg">
        {title && <h2 className="font-display text-headline-sm text-on-surface">{title}</h2>}
        <div className="font-body text-body-md text-on-surface-variant">{children}</div>
        <div className="flex gap-md justify-end">
          <Button variant="text" onClick={onCancel} className="px-lg">
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={confirming}
            className="px-lg"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
