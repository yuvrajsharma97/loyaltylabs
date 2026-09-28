const TONE_CLASSES = {
  success: 'bg-success-bg text-success-text',
  warning: 'bg-warning-bg text-warning-text',
  error: 'bg-error-bg text-error-text',
  info: 'bg-info-bg text-info-text',
  neutral: 'bg-surface-secondary text-text-primary',
};

const DOT_CLASSES = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  neutral: 'bg-text-muted',
};

// Status is always shown with a dot AND a label - never color alone.
const Badge = ({ tone = 'neutral', children, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-label ${TONE_CLASSES[tone]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]}`} />
      {children}
    </span>
  );
};

export default Badge;
