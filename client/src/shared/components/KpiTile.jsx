import Icon from './Icon';

const KpiTile = ({ label, value, deltaPercent }) => {
  const hasDelta = typeof deltaPercent === 'number';

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <p className="text-label text-text-muted">{label}</p>
      <p className="tabular-nums mt-1 text-amount text-text-primary">{value}</p>
      {hasDelta && (
        <p
          className={`mt-1 flex items-center gap-0.5 text-body-sm tabular-nums ${
            deltaPercent >= 0 ? 'text-success-text' : 'text-error-text'
          }`}
        >
          <Icon name={deltaPercent >= 0 ? 'arrow_upward' : 'arrow_downward'} style={{ fontSize: '1em' }} />
          {Math.abs(deltaPercent)}%
        </p>
      )}
    </div>
  );
};

export default KpiTile;
