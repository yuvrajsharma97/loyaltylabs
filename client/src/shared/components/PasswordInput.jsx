import { useId, useState } from 'react';
import Icon from './Icon';

const PasswordInput = ({ label = 'Password', error, id, className = '', ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  const generatedId = useId();
  const inputId = id || generatedId;

  const handleToggleVisibility = () => {
    setIsVisible((currentIsVisible) => !currentIsVisible);
  };

  const borderClasses = error
    ? 'border-error focus-within:border-error'
    : 'border-border focus-within:border-primary';

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-label text-text-secondary">
        {label}
      </label>
      <div
        className={`flex h-11 items-center gap-2 rounded-input border bg-surface px-3 ${borderClasses}`}
      >
        <Icon name="lock" className="text-text-muted" />
        <input
          id={inputId}
          type={isVisible ? 'text' : 'password'}
          className={`h-full flex-1 bg-transparent text-body text-text-primary outline-none ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={handleToggleVisibility}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          className="flex items-center text-text-muted hover:text-text-primary"
        >
          <Icon name={isVisible ? 'visibility_off' : 'visibility'} />
        </button>
      </div>
      {error && <span className="text-body-sm text-error-text">{error}</span>}
    </div>
  );
};

export default PasswordInput;
