import { Link } from 'react-router-dom';
import ListingCard from '../../shared/components/ListingCard';
import Button from '../../shared/components/Button';
import { placeholderImageUrl } from '../../shared/utils/placeholderImage';

const CATEGORY_LABELS = { cafe: 'Cafe', retail: 'Retail', services: 'Services', other: 'Other' };

// Shared shop tile used by both CustomerHome and StoreDirectory - the heart
// is a read-only indicator of membership (filled = already joined), not a
// clickable control; joining still only happens via the "Join" button.
export default function ShopCard({ store, isJoined, joining, onJoin, className = '' }) {
  return (
    <ListingCard
      variant="overlay"
      imageUrl={placeholderImageUrl(store._id, 500, 600)}
      imageAlt={`${store.name} storefront`}
      title={store.name}
      subtitle={store.address}
      className={className}
      cornerBadge={
        <span className="bg-secondary text-on-secondary px-md py-2xs rounded-full text-xs font-bold shadow-lg">
          {CATEGORY_LABELS[store.category] || store.category}
        </span>
      }
      showHeart
      heartFilled={isJoined}
    >
      <div className="flex gap-sm">
        <Link to={`/customer/shops/${store._id}`} className="flex-1">
          <Button size="sm" className="w-full !rounded-full">
            View shop
          </Button>
        </Link>
        {!isJoined && (
          <Button
            size="sm"
            variant="text"
            className="flex-1 !rounded-full border border-white/40 !text-white hover:!bg-white/20"
            loading={joining}
            onClick={onJoin}
          >
            Join
          </Button>
        )}
      </div>
    </ListingCard>
  );
}
