// Shared "listing" card - two variants adapted from a travel-booking card
// reference: 'overlay' (full-bleed photo, gradient, title/meta/CTA overlaid
// at the bottom) and 'plain' (photo on top, content in a panel below). Used
// for every image-based listing tile in the app (shop tiles, reward tiles)
// so they all share one implementation instead of each screen hand-rolling
// its own card markup.
export default function ListingCard({
  variant = 'plain',
  imageUrl,
  imageAlt,
  title,
  subtitle,
  cornerBadge,
  metaItems = [],
  showHeart = false,
  heartFilled = false,
  titleAction,
  className = '',
  children
}) {
  const heart = showHeart && (
    <HeartIndicator filled={heartFilled} onOverlay={variant === 'overlay'} />
  );

  if (variant === 'overlay') {
    return (
      <div
        className={`group w-full rounded-3xl overflow-hidden elevation-l1 hover:elevation-l2 hover:scale-[1.02] transition-all duration-300 bg-surface-container-lowest border border-outline-variant ${className}`}
      >
        <div className="relative h-72 md:h-80">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {cornerBadge && <div className="absolute top-md left-md">{cornerBadge}</div>}
          {heart && <div className="absolute top-md right-md">{heart}</div>}

          <div className="absolute bottom-0 left-0 right-0 p-lg text-white">
            <h3 className="font-display text-headline-sm font-bold mb-2xs">{title}</h3>
            {subtitle && <p className="text-white/70 text-body-sm mb-md">{subtitle}</p>}
            {metaItems.length > 0 && (
              <div className="flex items-center gap-lg mb-md text-body-sm">
                {metaItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-lg">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group w-full rounded-3xl overflow-hidden elevation-l1 hover:elevation-l2 hover:scale-[1.02] transition-all duration-300 bg-surface-container-lowest border border-outline-variant flex flex-col ${className}`}
    >
      <div className="relative h-40 md:h-44 overflow-hidden shrink-0">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {cornerBadge && <div className="absolute top-md right-md">{cornerBadge}</div>}
      </div>
      <div className="p-lg flex flex-col gap-md flex-1">
        <div className="flex items-start justify-between gap-sm">
          <div className="min-w-0">
            <h3 className="font-display text-body-lg font-bold mb-2xs">{title}</h3>
            {subtitle && <p className="text-on-surface-variant text-body-sm">{subtitle}</p>}
          </div>
          {titleAction && <div className="shrink-0">{titleAction}</div>}
        </div>
        {metaItems.length > 0 && (
          <div className="flex items-center gap-lg text-body-sm text-on-surface-variant">
            {metaItems.map((item, i) => (
              <div key={i} className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-sm items-center mt-auto pt-lg">
          {children}
          {heart}
        </div>
      </div>
    </div>
  );
}

// Read-only indicator (not a button - nothing to click) reflecting whether
// the viewer has already joined/subscribed to this listing.
function HeartIndicator({ filled, onOverlay }) {
  const wrapperClass = onOverlay
    ? 'p-sm rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0'
    : `p-md rounded-full border-2 flex items-center justify-center shrink-0 ${
        filled ? 'border-error bg-error-container/20' : 'border-outline-variant'
      }`;
  const iconClass = onOverlay ? 'text-white' : filled ? 'text-error' : 'text-on-surface-variant';

  return (
    <div className={wrapperClass} title={filled ? 'Joined' : 'Not joined'} aria-label={filled ? 'Joined' : 'Not joined'}>
      <span
        className={`material-symbols-outlined ${iconClass}`}
        style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        favorite
      </span>
    </div>
  );
}
