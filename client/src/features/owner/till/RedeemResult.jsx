import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';

const AMBER_CODES = ['REDEMPTION_EXPIRED'];

export default function RedeemResult({ success, error, onDone }) {
  if (success) {
    return (
      <Card className="flex flex-col items-center gap-lg text-center border-2 border-tertiary">
        <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 48 }}>
          check_circle
        </span>
        <p className="font-display text-headline-sm">Redemption fulfilled</p>
        <p className="text-body-md text-on-surface-variant">{success.pointsSpent.toLocaleString()} pts spent</p>
        <Button onClick={onDone} className="w-full">
          Done
        </Button>
      </Card>
    );
  }

  const amber = AMBER_CODES.includes(error?.code);

  return (
    <Card className={`flex flex-col items-center gap-lg text-center border-2 ${amber ? 'border-secondary' : 'border-error'}`}>
      <span
        className={`material-symbols-outlined ${amber ? 'text-secondary' : 'text-error'}`}
        style={{ fontSize: 48 }}
      >
        {amber ? 'warning' : 'cancel'}
      </span>
      <p className="font-display text-headline-sm">{amber ? 'Code expired' : 'Could not redeem'}</p>
      <p className="text-body-md text-on-surface-variant">{error?.message || 'Something went wrong'}</p>
      <Button onClick={onDone} variant={amber ? 'primary' : 'danger'} className="w-full">
        Done
      </Button>
    </Card>
  );
}
