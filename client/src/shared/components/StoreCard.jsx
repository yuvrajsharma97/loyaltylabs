import { Link } from 'react-router-dom';
import Button from './Button';
import Badge from './Badge';
import Avatar from './Avatar';
import Icon from './Icon';
import { CATEGORY_LABELS } from '../utils/labels';

// Shop tile shared by the customer Home and the directory. Joining only ever
// happens via the Join button - the "Member" badge is a read-only indicator.
//
// Phones: a compact horizontal card (shop tile on the left) so several fit on
// screen. Wider screens: a vertical card with a banner on top. A shop with no
// logo gets the app's standard rounded-square initials tile, not a stretched
// placeholder image.
const StoreCard = ({ store, isJoined, isJoining = false, onJoin }) => {
  const categoryLabel = CATEGORY_LABELS[store.category] || store.category;

  return (
    <div className="flex overflow-hidden rounded-card border border-border bg-surface shadow-card wide:flex-col">
      <Link
        to={`/customer/shops/${store._id}`}
        state={{ store }}
        aria-label={store.name}
        className="relative w-24 shrink-0 self-stretch bg-surface-secondary wide:aspect-[16/9] wide:w-full wide:self-auto"
      >
        {store.logoUrl ? (
          <img src={store.logoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <Avatar name={store.name} shape="square" size="lg" />
          </span>
        )}
        <span className="glass-pill absolute left-3 top-3 hidden rounded-pill px-2.5 py-1 text-label text-text-primary wide:inline-block">
          {categoryLabel}
        </span>
        {/* Phones: the Member badge sits on the tile so the shop name keeps the full width. */}
        {isJoined && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 wide:hidden">
            <Badge tone="success">Member</Badge>
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 wide:gap-3 wide:p-4">
        <div className="min-w-0">
          {/* Fixed row height on wider cards so they line up whether or not the Member badge shows. */}
          <div className="flex items-center gap-2 wide:h-7">
            {/* Up to two lines on phones; one line on wider cards. */}
            <h3 className="line-clamp-2 text-card-title text-text-primary wide:truncate">{store.name}</h3>
            {/* Wrapped because Badge sets its own display, which would override `hidden`. */}
            {isJoined && (
              <span className="hidden shrink-0 wide:inline-flex">
                <Badge tone="success">Member</Badge>
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-body-sm text-text-secondary">
            <Icon name="location_on" className="shrink-0" style={{ fontSize: '1rem' }} />
            <span className="truncate">
              <span className="wide:hidden">{categoryLabel}</span>
              <span className="wide:hidden">{store.address && ' · '}</span>
              {store.address}
            </span>
          </p>
        </div>

        <div className="mt-auto flex gap-2">
          <Link to={`/customer/shops/${store._id}`} state={{ store }} className="flex-1">
            <Button size="sm" variant={isJoined ? 'primary' : 'secondary'} className="w-full">
              View shop
            </Button>
          </Link>
          {!isJoined && (
            <Button size="sm" className="flex-1" isLoading={isJoining} onClick={onJoin}>
              Join
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreCard;
