const VARIANT_CLASSES = {
  default: 'bg-transparent text-text-secondary hover:bg-primary-tint hover:text-primary',
  active: 'bg-primary-tint text-primary',
};

const IconButton = ({
  variant = 'default',
  label,
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-button transition-colors duration-150 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
