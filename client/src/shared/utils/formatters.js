export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export function formatPoints(points) {
  const n = Number(points) || 0;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toLocaleString()}`;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(amount) || 0);
}
