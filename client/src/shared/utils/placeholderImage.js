// Used where a full banner/logo image is expected (Store Card, Store
// Detail) and the store hasn't uploaded a logoUrl yet - Avatar's initials
// tile covers the smaller monogram cases elsewhere.
export function getPlaceholderImageUrl(seed = '') {
  const initial = seed.trim().charAt(0).toUpperCase() || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="#EBE3A7"/>
    <text x="50%" y="54%" text-anchor="middle" font-family="sans-serif" font-size="72" fill="#5A5410">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
