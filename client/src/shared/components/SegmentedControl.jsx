// Wraps onto a second row rather than overflowing sideways on narrow screens.
const SegmentedControl = ({ options, value, onChange, className = '' }) => {
  return (
    <div className={`inline-flex max-w-full flex-wrap gap-1 rounded-[22px] border border-border bg-surface p-1 ${className}`}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-pill px-4 py-1.5 text-label transition-colors duration-150 ${
              isActive ? 'bg-primary-tint text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
