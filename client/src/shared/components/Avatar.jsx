function getInitials(name) {
  if (!name) return '?';

  // Skip words that don't start with a letter or digit, so "Bloom & Petal"
  // reads "BP" rather than "B&".
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => /^[\p{L}\p{N}]/u.test(word));
  if (words.length === 0) return '?';
  const initials = words.slice(0, 2).map((word) => word[0]);
  return initials.join('').toUpperCase();
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-label',
  md: 'h-10 w-10 text-card-title',
  lg: 'h-12 w-12 text-section',
};

// Shops/stores get a rounded-square tile, people get a full circle - this
// distinction is deliberate throughout the design (Admin Dashboard, Owner
// Dashboard, Auth & Onboarding).
const Avatar = ({ name, shape = 'circle', size = 'md', imageUrl, className = '' }) => {
  const shapeClasses = shape === 'square' ? 'rounded-button' : 'rounded-full';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${SIZE_CLASSES[size]} ${shapeClasses} object-cover ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center bg-primary-tint font-semibold text-primary ${SIZE_CLASSES[size]} ${shapeClasses} ${className}`}
    >
      {getInitials(name)}
    </span>
  );
};

export default Avatar;
