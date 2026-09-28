import { useId } from 'react';

const Input = ({ label, error, id, className = '', ...props }) => {
  const generatedId = useId();
  const inputId = id || generatedId;
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
        className={`h-11 rounded-input border bg-surface px-3 text-body text-text-primary outline-none disabled:bg-surface-disabled disabled:text-text-disabled ${borderClasses} ${className}`}
        {...props}
      />
      {error && <span className="text-body-sm text-error-text">{error}</span>}
    </div>
  );
};

export default Input;
