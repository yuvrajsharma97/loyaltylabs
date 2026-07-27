import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';

export default function SuccessScreen({ result, onDone }) {
  return (
    <Card className="flex flex-col items-center gap-lg text-center">
      <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 48 }}>
        check_circle
      </span>
      <p className="font-display text-headline-sm">
        +{result.pointsAwarded.toLocaleString()} points awarded
      </p>
      <p className="text-body-md text-on-surface-variant">
        New balance: {result.newBalance.toLocaleString()} pts
      </p>
      {result.pointsCapApplied && (
        <p className="text-body-sm text-secondary">This customer hit the store's maximum points balance.</p>
      )}
      <Button onClick={onDone} className="w-full">
        Done
      </Button>
    </Card>
  );
}
