import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { listStores, joinStore } from '../../api/stores';
import { useCustomer } from './CustomerDashboard';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ShopCard from './ShopCard';
import { placeholderImageUrl } from '../../shared/utils/placeholderImage';

const CATEGORIES = [
  { value: 'cafe', label: 'Coffee & Cafes', icon: 'local_cafe' },
  { value: 'services', label: 'Barbers & Beauty', icon: 'content_cut' },
  { value: 'retail', label: 'Retail & Boutiques', icon: 'shopping_bag' },
  { value: 'other', label: 'Other', icon: 'apps' }
];

const PAGE_SIZE = 6;

export default function StoreDirectory() {
  const { me } = useCustomer();
  const [stores, setStores] = useState(null);
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [shopsTab, setShopsTab] = useState('subscribed');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [joiningId, setJoiningId] = useState(null);
  const [joinedIds, setJoinedIds] = useState(() => new Set(me.memberships.map((m) => m.storeId)));

  useEffect(() => {
    listStores(category ? { category: [category] } : undefined)
      .then(setStores)
      .catch((err) => toast.error(err.message || 'Could not load shops'));
  }, [category]);

  const filtered = useMemo(() => {
    if (!stores) return null;
    const bySearch = search.trim()
      ? stores.filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()))
      : stores;
    return bySearch.filter((s) =>
      shopsTab === 'subscribed' ? joinedIds.has(s._id) : !joinedIds.has(s._id)
    );
  }, [stores, search, shopsTab, joinedIds]);

  // Reset pagination whenever the active filter/search/tab changes, so
  // switching categories or tabs doesn't leave you deep into a stale
  // "load more" position. Adjusted during render (React's documented
  // pattern for resetting state when an input changes) rather than in an
  // effect, which would cause an extra commit-then-recommit render pass.
  const filterKey = `${category}|${search}|${shopsTab}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  let effectiveVisibleCount = visibleCount;
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    effectiveVisibleCount = PAGE_SIZE;
    setVisibleCount(PAGE_SIZE);
  }

  const visible = filtered ? filtered.slice(0, effectiveVisibleCount) : null;

  const handleJoin = async (storeId) => {
    setJoiningId(storeId);
    try {
      await joinStore(storeId);
      setJoinedIds((prev) => new Set(prev).add(storeId));
      toast.success('Joined!');
    } catch (err) {
      if (err.code === 'ALREADY_A_MEMBER') {
        setJoinedIds((prev) => new Set(prev).add(storeId));
      } else {
        toast.error(err.message || 'Could not join this store');
      }
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="flex flex-col gap-xl max-w-[1400px] mx-auto">
      {/* Hero */}
      <section className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden elevation-l1">
        <img
          alt="Neighborhood street with local shops"
          className="absolute inset-0 w-full h-full object-cover"
          src={placeholderImageUrl('shops-directory-hero', 1400, 700)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-xl text-white">
          <h1 className="font-display text-display-md-mobile md:text-display-lg font-bold mb-xs">
            Explore neighborhood gems
          </h1>
          <p className="text-white/90 text-body-md max-w-[36rem]">
            Support local shops and earn rewards at your favorite neighborhood spots.
          </p>
        </div>
      </section>

      {/* Category filter, mobile: a horizontally-scrollable tab row instead
          of the desktop sidebar's vertical list - hidden at lg+. */}
      <div className="lg:hidden -mx-container-margin px-container-margin overflow-x-auto">
        <div className="flex gap-sm w-max pb-xs">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`shrink-0 flex items-center gap-xs px-lg py-sm rounded-full font-body text-body-sm font-semibold transition-all active:scale-95 ${
              category === null
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            All Shops
          </button>
          {CATEGORIES.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={`shrink-0 flex items-center gap-xs px-lg py-sm rounded-full font-body text-body-sm font-semibold transition-all active:scale-95 ${
                category === value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-xl items-start">
        {/* Category filter sidebar (desktop only, lg+) - a normal in-flow
            column (not fixed), so it never competes with the app's own
            floating top nav. Mobile uses the tab row above instead. */}
        <aside className="hidden lg:flex flex-col gap-xs bg-surface-container-low rounded-2xl p-lg lg:sticky lg:top-24">
          <div className="mb-sm">
            <h2 className="font-display text-body-lg font-bold text-primary">Categories</h2>
            <p className="text-on-surface-variant text-body-sm">Filter by shop type</p>
          </div>
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`flex items-center gap-sm px-md py-sm rounded-lg font-body text-body-md font-semibold transition-all active:scale-95 ${
              category === null
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">storefront</span>
            All Shops
          </button>
          {CATEGORIES.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={`flex items-center gap-sm px-md py-sm rounded-lg font-body text-body-md font-semibold transition-all active:scale-95 ${
                category === value
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </button>
          ))}
        </aside>

        {/* Main content: search + grid + load more */}
        <div className="flex flex-col gap-lg min-w-0">
          <div className="flex items-center gap-xs bg-surface-container-low px-lg py-sm rounded-full border border-outline-variant">
            <span className="material-symbols-outlined text-outline">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shops..."
              className="flex-1 bg-transparent border-none outline-none font-body text-body-md placeholder:text-outline"
            />
          </div>

          <div className="flex rounded-lg bg-surface-container-low p-1 gap-1 w-full">
            {[
              ['subscribed', 'Your shops'],
              ['discover', 'Discover more']
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setShopsTab(value)}
                className={`flex-1 px-lg py-sm rounded-md font-body text-body-sm font-semibold transition-colors ${
                  shopsTab === value ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!visible ? (
            <LoadingSpinner />
          ) : visible.length === 0 ? (
            <Card className="text-body-sm text-on-surface-variant">
              {shopsTab === 'subscribed' ? "You haven't joined any shops yet." : 'No shops found.'}
            </Card>
          ) : (
            <>
              {/* Flex-wrap, not a fixed grid-cols count - however many
                  fixed-width cards fit the available width flow per row,
                  same card footprint as the "Featured shops" cards on the
                  dashboard. Below ~360px a card fills the full row width
                  (standard mobile single-column pattern) instead of
                  overflowing or getting clipped. */}
              <div className="flex flex-wrap justify-center gap-lg">
                {visible.map((store) => (
                  <ShopCard
                    key={store._id}
                    store={store}
                    isJoined={joinedIds.has(store._id)}
                    joining={joiningId === store._id}
                    onJoin={() => handleJoin(store._id)}
                    className="w-full max-w-[320px]"
                  />
                ))}
              </div>

              {effectiveVisibleCount < filtered.length && (
                <Button
                  variant="text"
                  className="w-fit self-center !rounded-full border-2 border-primary !text-primary hover:!bg-primary/5 px-xl"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  <span className="flex items-center gap-sm">
                    Load more shops
                    <span className="material-symbols-outlined">expand_more</span>
                  </span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
