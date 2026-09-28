import { useId } from 'react';

// `error` shows under the field and marks it invalid for screen readers;
// pass `error={true}` to highlight the field while showing the message
// elsewhere (e.g. a narrow column). `hint` is optional helper text shown
// when there's no error.
const Input = ({ label, error, hint, id, className = '', ...props }) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const messageId = `${inputId}-message`;
  const message = typeof error === 'string' ? error : null;
  const borderClasses = error
    ? 'border-error focus:border-error'
    : 'border-border focus:border-primary';

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-label text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={message || hint ? messageId : undefined}
        className={`h-11 rounded-input border bg-surface px-3 text-body text-text-primary outline-none disabled:bg-surface-disabled disabled:text-text-disabled ${borderClasses} ${className}`}
        {...props}
      />
      {message ? (
        <span id={messageId} className="text-body-sm text-error-text">
          {message}
        </span>
      ) : (
        !error &&
        hint && (
          <span id={messageId} className="text-body-sm text-text-muted">
            {hint}
          </span>
        )
      )}
    </div>
  );
};

export default Input;
