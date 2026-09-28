import toast from 'react-hot-toast';

// Two distinct toast treatments from the design: a dark pill at the bottom
// for success/action feedback, and a white dismissible card at the top for
// errors that need the user's attention.
export function showSuccessToast(message) {
  toast.custom(
    (t) => (
      <div
        className={`flex items-center gap-2 rounded-pill bg-text-primary px-4 py-2.5 text-body-sm text-surface shadow-dialog transition-opacity ${
          t.visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="material-symbols-outlined filled text-accent" style={{ fontSize: '1.1em' }}>
          check_circle
        </span>
        {message}
      </div>
    ),
    { position: 'bottom-center' }
  );
}

export function showErrorToast(message) {
  toast.custom(
    (t) => (
      <div
        className={`flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 text-body-sm text-text-primary shadow-dialog transition-opacity ${
          t.visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="material-symbols-outlined text-error" style={{ fontSize: '1.1em' }}>
          error
        </span>
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          aria-label="Dismiss"
          className="text-text-muted hover:text-text-primary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1em' }}>
            close
          </span>
        </button>
      </div>
    ),
    { position: 'top-center' }
  );
}
