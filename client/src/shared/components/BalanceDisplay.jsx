import Icon from './Icon';

const BalanceDisplay = ({ points, deltaPoints, cashEquivalent }) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label text-text-muted">Balance</span>
      <div className="flex items-baseline gap-2">
        <span className="tabular-nums text-display text-text-primary">{points}</span>
        <span className="text-body text-text-secondary">points</span>
        {typeof deltaPoints === 'number' && deltaPoints !== 0 && (
          <span
            className={`flex items-center text-body-sm tabular-nums ${
              deltaPoints > 0 ? 'text-success-text' : 'text-error-text'
            }`}
          >
            <Icon name={deltaPoints > 0 ? 'arrow_upward' : 'arrow_downward'} style={{ fontSize: '1em' }} />
            {Math.abs(deltaPoints)}
          </span>
        )}
      </div>
      {cashEquivalent && (
        <span className="border-t border-divider pt-1 text-body-sm text-text-muted">
          ≈ {cashEquivalent}
        </span>
      )}
    </div>
  );
};

export default BalanceDisplay;
