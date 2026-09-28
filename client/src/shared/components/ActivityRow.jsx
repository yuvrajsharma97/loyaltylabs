import Avatar from './Avatar';
import { formatDateTime, formatSignedPoints } from '../utils/formatters';

// Same anatomy for the customer's own wallet history and the owner's store
// feed - only the row height differs (48px customer, 40px owner/denser
// desktop lists).
const ActivityRow = ({ title, subtitle, timestamp, points, avatarName, density = 'comfortable' }) => {
  const isPositive = points > 0;
  const rowHeight = density === 'compact' ? 'py-2' : 'py-3';

  return (
    <div className={`flex items-center gap-3 border-b border-divider last:border-0 ${rowHeight}`}>
      <Avatar name={avatarName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-card-title text-text-primary">{title}</p>
        {subtitle && <p className="truncate text-body-sm text-text-secondary">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span
          className={`tabular-nums text-body ${isPositive ? 'text-success-text' : 'text-error-text'}`}
        >
          {formatSignedPoints(points)}
        </span>
        <span className="font-mono text-label text-text-muted">{formatDateTime(timestamp)}</span>
      </div>
    </div>
  );
};

export default ActivityRow;
