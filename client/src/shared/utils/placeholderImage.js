// No image upload/CDN pipeline exists yet (ImageKit isn't wired up) - these
// are seeded placeholders so the same store/reward always gets the same
// picture instead of a random one on every render.
export function placeholderImageUrl(seed, width = 600, height = 400) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}
