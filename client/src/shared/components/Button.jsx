const VARIANT_CLASSES = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed',
  secondary:
    'bg-transparent text-primary border border-primary hover:bg-primary-tint',
  ghost: 'bg-transparent text-primary hover:bg-primary-tint',
  // Destructive actions are always outlined, never filled solid red.
  danger:
    'bg-transparent text-error-text border border-error hover:bg-error-bg',
};

const SIZE_CLASSES = {
  md: 'h-12 px-5 text-body',
  sm: 'h-11 px-4 text-label',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-button font-medium transition-colors duration-150 disabled:opacity-45 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
};

export default Button;
