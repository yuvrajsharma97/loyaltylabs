import Button from './Button';
import Badge from './Badge';

const RewardCard = ({ reward, pointsBalance, onRedeem, isRedeeming = false, isMember = true }) => {
  const isEnded = Boolean(reward.validTo) && new Date(reward.validTo) < new Date();
  const canAfford = pointsBalance >= reward.pointsRequired;
  const pointsShort = reward.pointsRequired - pointsBalance;
  const canRedeem = isMember && !isEnded && canAfford;

  let hint = null;
  if (isEnded) hint = 'This reward has ended';
  else if (!isMember) hint = 'Join this shop to redeem';
  else if (!canAfford) hint = `Need ${pointsShort} more points`;

  return (
    <div className={`flex flex-col gap-3 rounded-card bg-surface-secondary p-4 ${isEnded ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-card-title text-text-primary">{reward.title}</h3>
        {isEnded ? (
          <Badge tone="neutral">Ended</Badge>
        ) : (
          <span className="tabular-nums whitespace-nowrap text-label text-text-secondary">
            {reward.pointsRequired} pts
          </span>
        )}
      </div>
      {reward.description && <p className="text-body-sm text-text-secondary">{reward.description}</p>}
      <Button
        variant="primary"
        size="sm"
        disabled={!canRedeem}
        isLoading={isRedeeming}
        onClick={() => onRedeem(reward)}
      >
        Redeem for {reward.pointsRequired} pts
      </Button>
      {/* A reward the customer can't redeem stays visible with the reason shown, not hidden. */}
      {hint && <span className="text-label text-text-muted">{hint}</span>}
    </div>
  );
};

export default RewardCard;
