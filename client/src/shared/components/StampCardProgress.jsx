import Icon from './Icon';

const MAX_SLOTS = 12;

// Discrete slots up to 12 stamps; beyond that a slot grid gets unreadable,
// so it switches to a plain progress bar instead.
const StampCardProgress = ({ current, total }) => {
  if (total > MAX_SLOTS) {
    const percent = Math.min(100, Math.round((current / total) * 100));
    return (
      <div className="flex flex-col gap-1.5">
        <div className="h-2 w-full overflow-hidden rounded-pill bg-surface-disabled">
          <div className="h-full rounded-pill bg-accent" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-label text-text-secondary">
          {current} / {total} stamps
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: total }, (_, index) => {
        const isFilled = index < current;
        return (
          <span
            key={index}
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isFilled ? 'bg-accent' : 'stamp-slot-empty'
            }`}
          >
            {isFilled && <Icon name="check" isFilled className="text-accent-text" style={{ fontSize: '1rem' }} />}
          </span>
        );
      })}
    </div>
  );
};

export default StampCardProgress;
