import { useCallback, useMemo, useState } from 'react';
import * as storesApi from '../../api/stores';
import { useAuth } from '../../shared/hooks/useAuth';
import { usePaginatedList } from '../../shared/hooks/usePaginatedList';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import Pagination from '../../shared/components/Pagination';
import ListPage from '../../shared/components/ListPage';
import ScrollPanel from '../../shared/components/ScrollPanel';
import { showSuccessToast } from '../../shared/utils/toast';
import { CATEGORIES } from '../../shared/utils/labels';
import SearchInput from '../../shared/components/SearchInput';
import SegmentedControl from '../../shared/components/SegmentedControl';
import StoreCard from '../../shared/components/StoreCard';
import Card from '../../shared/components/Card';
import Icon from '../../shared/components/Icon';
import EmptyState from '../../shared/components/EmptyState';
import SkeletonRow from '../../shared/components/SkeletonRow';

const CATEGORY_FILTERS = [{ value: '', label: 'All shops', icon: 'storefront' }, ...CATEGORIES];

// value is the API's `membership` filter ('' = every shop).
const SHOP_TABS = [
  { value: '', label: 'All' },
  { value: 'joined', label: 'Your shops' },
  { value: 'not_joined', label: 'Discover' },
];

const PAGE_SIZE = 10;

const StoreDirectory = () => {
  const { user, refreshProfile } = useAuth();
  const [category, setCategory] = useState('');
  const [membership, setMembership] = useState('');
  const [query, setQuery] = useState('');
  const [joiningStoreId, setJoiningStoreId] = useState(null);
  const search = useDebouncedValue(query.trim());

  // Search, category and membership filtering all happen server-side so they
  // apply across every page, not just the one on screen.
  const fetchPage = useCallback(
    (page) =>
      storesApi
        .listStores({
          category: category || undefined,
          membership: membership || undefined,
          search: search || undefined,
          page,
          limit: PAGE_SIZE,
        })
        .then(({ stores, pagination }) => ({ items: stores, pagination })),
    [category, membership, search]
  );
  const { items: visibleStores, pagination, setPage, isLoading, reload } = usePaginatedList(fetchPage);

  const joinedStoreIds = useMemo(
    () => new Set((user?.memberships || []).map((item) => item.storeId)),
    [user]
  );

  const handleJoin = async (store) => {
    setJoiningStoreId(store._id);
    try {
      await storesApi.joinStore(store._id);
      showSuccessToast(`You joined ${store.name}.`);
    } catch (err) {
      if (err.code !== 'ALREADY_A_MEMBER') throw err;
    } finally {
      await refreshProfile();
      setJoiningStoreId(null);
      // On "Discover" the joined shop now drops out of the list.
      if (membership === 'not_joined') reload();
    }
  };

  const header = (
    <>
      {/* Phones: just the search box (the shell header already says "Shops"),
          so the list keeps most of the screen. Wider screens: the tinted hero. */}
      <section className="wide:rounded-card wide:border wide:border-border wide:bg-primary-tint wide:p-5">
        <h1 className="hidden text-page-title text-text-primary wide:block">Explore neighbourhood gems</h1>
        <p className="mt-1 hidden max-w-lg text-body-sm text-text-secondary wide:block">
          Support local shops and earn rewards at your favourite spots nearby.
        </p>
        <div className="wide:mt-4">
          <SearchInput placeholder="Search shops" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </section>

      <div className="mt-3 flex flex-wrap items-center gap-2 wide:mt-4">
        {/* Category: a compact dropdown on phones, chips on wider screens. */}
        <label className="relative wide:hidden">
          <span className="sr-only">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 appearance-none rounded-pill border border-border bg-surface pl-3.5 pr-8 text-label text-text-primary outline-none focus:border-primary"
          >
            {CATEGORY_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Icon
            name="expand_more"
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
            style={{ fontSize: '1.1rem' }}
          />
        </label>

        <div className="hidden basis-full flex-wrap gap-2 wide:flex">
          {CATEGORY_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setCategory(option.value)}
              className={`flex items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-label transition-colors duration-150 ${
                category === option.value
                  ? 'border-primary bg-primary-tint text-primary'
                  : 'border-border bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name={option.icon} style={{ fontSize: '1.05rem' }} />
              {option.label}
            </button>
          ))}
        </div>

        <SegmentedControl options={SHOP_TABS} value={membership} onChange={setMembership} className="wide:mt-1" />
      </div>
    </>
  );

  return (
    <ListPage
      maxWidthClassName="max-w-5xl"
      header={header}
      footer={<Pagination pagination={pagination} onPageChange={setPage} isDisabled={isLoading} itemLabel="shops" />}
    >
      <ScrollPanel resetKey={visibleStores[0]?._id} className="-mx-1 flex-1 px-1 py-1">
        {isLoading && visibleStores.length === 0 ? (
          <Card>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </Card>
        ) : visibleStores.length === 0 ? (
          <EmptyState
            icon={membership === 'joined' ? 'storefront' : 'search_off'}
            title={membership === 'joined' ? 'No joined shops match' : 'No shops found'}
            body={membership === 'joined' ? 'Switch to Discover to find one.' : 'Try a different search or category.'}
          />
        ) : (
          <div
            className={`grid gap-4 transition-opacity duration-150 wide:grid-cols-2 rail:grid-cols-3 ${
              isLoading ? 'opacity-50' : ''
            }`}
          >
            {visibleStores.map((store) => (
              <StoreCard
                key={store._id}
                store={store}
                isJoined={joinedStoreIds.has(store._id)}
                isJoining={joiningStoreId === store._id}
                onJoin={() => handleJoin(store)}
              />
            ))}
          </div>
        )}
      </ScrollPanel>
    </ListPage>
  );
};

export default StoreDirectory;
