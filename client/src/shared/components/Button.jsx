const VARIANT_CLASSES = {
  primary:
    'bg-primary text-on-primary font-bold hover:shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-60 disabled:hover:scale-100',
  text: 'font-body font-semibold text-on-surface-variant hover:bg-surface-container-low hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-60 disabled:hover:scale-100',
  danger:
    'bg-error text-on-error font-bold hover:shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-60 disabled:hover:scale-100'
};

const SIZE_CLASSES = {
  md: 'py-md',
  sm: 'py-sm text-body-sm'
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  disabled,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${SIZE_CLASSES[size]} rounded-lg ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {loading ? loadingText || 'Saving...' : children}
    </button>
  );
}
