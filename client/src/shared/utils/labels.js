// Human-readable labels for backend enum values, shared across customer,
// owner and admin screens so the same ledger entry reads the same everywhere.

export const TRANSACTION_LABELS = {
  earn: 'Points earned',
  redeem: 'Reward redeemed',
  adjust: 'Balance adjusted',
  reversal: 'Redemption reversed',
  expiry: 'Points expired',
  suspension_reversal: 'Refunded (store suspended)',
};

export const TRANSACTION_TYPES = Object.keys(TRANSACTION_LABELS);

export const VERIFICATION_LABELS = {
  qr_scan: 'QR scan',
  slug_manual: 'Manual code',
};

export const DISPUTE_TYPE_LABELS = {
  earn: 'Points earned',
  redemption: 'Reward redemption',
  reversal: 'Redemption reversal',
};

export const CATEGORIES = [
  { value: 'cafe', label: 'Cafes', icon: 'local_cafe' },
  { value: 'retail', label: 'Retail', icon: 'shopping_bag' },
  { value: 'services', label: 'Services', icon: 'content_cut' },
  { value: 'other', label: 'Other', icon: 'apps' },
];

export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map(({ value, label }) => [value, label]));

export function getTransactionLabel(type) {
  return TRANSACTION_LABELS[type] || type;
}
