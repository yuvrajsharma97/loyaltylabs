import Card from '../../../shared/components/Card';

export default function CustomerCard({ customer }) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="font-display text-body-lg font-bold">{customer.name}</p>
        <p className="text-body-sm text-on-surface-variant">Current balance</p>
      </div>
      <p className="font-display text-headline-sm text-primary">{customer.pointsBalance.toLocaleString()} pts</p>
    </Card>
  );
}
