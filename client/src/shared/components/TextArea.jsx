import { useId } from 'react';

// Multi-line counterpart to Input: label, error, and a live character count
// when maxLength is set.
const TextArea = ({ label, error, maxLength, value = '', id, className = '', rows = 4, ...props }) => {
  const generatedId = useId();
  const textAreaId = id || generatedId;
  const messageId = `${textAreaId}-message`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textAreaId} className="text-label text-text-secondary">
          {label}
        </label>
      )}
      <textarea
        id={textAreaId}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? messageId : undefined}
        className={`rounded-input border bg-surface p-3 text-body text-text-primary outline-none ${
          error ? 'border-error focus:border-error' : 'border-border focus:border-primary'
        } ${className}`}
        {...props}
      />
      <div className="flex items-start justify-between gap-3">
        <span id={messageId} className="text-body-sm text-error-text">
          {error}
        </span>
        {maxLength && (
          <span className="shrink-0 tabular-nums text-label text-text-muted">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export default TextArea;
