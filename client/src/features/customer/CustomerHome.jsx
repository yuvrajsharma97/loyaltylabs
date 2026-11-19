import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import * as storesApi from '../../api/stores';
import * as customerApi from '../../api/customer';
import { useAuth } from '../../shared/hooks/useAuth';
import { showSuccessToast } from '../../shared/utils/toast';
import { getTransactionLabel } from '../../shared/utils/labels';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import Icon from '../../shared/components/Icon';
import EmptyState from '../../shared/components/EmptyState';
import SkeletonRow from '../../shared/components/SkeletonRow';
import { formatDateTime, formatSignedPoints } from '../../shared/utils/formatters';
import SegmentedControl from '../../shared/components/SegmentedControl';
import BalanceDisplay from '../../shared/components/BalanceDisplay';
import StoreCard from '../../shared/components/StoreCard';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

const SHOP_TABS = [
  { value: 'mine', label: 'Your shops' },
  { value: 'discover', label: 'Discover' },
];

const FEATURED_COUNT = 4;

const TipCard = () => (
  <div className="relative overflow-hidden rounded-card bg-primary p-4 text-on-primary">
    <span className="rounded-pill bg-accent px-2.5 py-1 text-label text-accent-text">Tip</span>
    <h3 className="mt-3 text-card-title">Keep your streak going</h3>
    <p className="mt-1 text-body-sm opacity-80">
      Visit your favourite shops regularly to earn points faster and unlock more rewards.
    </p>
    <Icon name="redeem" className="pointer-events-none absolute -bottom-6 -right-4 opacity-10" style={{ fontSize: '7rem' }} />
  </div>
);

const LoyaltyCardPanel = () => {
  const [qrToken, setQrToken] = useState(null);
  const [qrError, setQrError] = useState(null);

  useEffect(() => {
    customerApi
      .getQrToken()
      .then(({ qrToken: token }) => setQrToken(token))
      .catch((err) => setQrError(err));
  }, []);

  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <h2 className="text-card-title text-text-primary">Your loyalty card</h2>
      {qrError ? (
        <p className="text-body-sm text-text-secondary">
          {qrError.code === 'QR_NOT_ISSUED'
            ? 'Verify your email to activate your loyalty code.'
            : qrError.message}
        </p>
      ) : !qrToken ? (
        <LoadingSpinner className="py-8" />
      ) : (
        <Link
          to="/customer/scan"
          aria-label="Open your code full screen"
          className="rounded-card border border-dashed border-border-strong bg-surface p-3 transition-transform duration-150 hover:scale-[1.02]"
        >
          <QRCodeSVG value={qrToken} size={148} fgColor="#1C1F16" bgColor="#FFFFFF" />
        </Link>
      )}
      <p className="text-body-sm text-text-secondary">Scan at the till to earn points or collect a reward.</p>
    </Card>
  );
};

const CustomerHome = () => {
  const { user, refreshProfile } = useAuth();
  const [stores, setStores] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [shopsTab, setShopsTab] = useState('mine');
  const [joiningStoreId, setJoiningStoreId] = useState(null);
  const [storesReloadKey, setStoresReloadKey] = useState(0);

  useEffect(() => {
    customerApi.getTransactions({ limit: 5 }).then(({ transactions: fetched }) => setTransactions(fetched));
  }, []);

  // Only the handful of shops shown here - the directory pages through the rest.
  useEffect(() => {
    setStores(null);
    storesApi
      .listStores({ membership: shopsTab === 'mine' ? 'joined' : 'not_joined', limit: FEATURED_COUNT })
      .then(({ stores: fetched }) => setStores(fetched));
  }, [shopsTab, storesReloadKey]);

  const memberships = useMemo(() => user?.memberships || [], [user]);
  const joinedStoreIds = useMemo(() => new Set(memberships.map((membership) => membership.storeId)), [memberships]);
  const totalPoints = memberships.reduce((sum, membership) => sum + membership.pointsBalance, 0);
  const storeNameById = useMemo(
    () => Object.fromEntries(memberships.map((membership) => [membership.storeId, membership.store?.name])),
    [memberships]
  );

  const visibleStores = stores || [];

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
      setStoresReloadKey((key) => key + 1);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-page-title text-text-primary">Hi {user?.name?.split(' ')[0]}</h1>
      <p className="mt-1 text-body-sm text-text-secondary">Here&apos;s where you stand at every shop.</p>

      {/* minmax(0,1fr) so wide content can't stretch the column past the screen on phones. */}
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 rail:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <BalanceDisplay points={totalPoints} />
            <p className="flex items-center gap-1.5 rounded-button bg-primary-tint px-3 py-2 text-body-sm text-primary">
              <Icon name="trending_up" style={{ fontSize: '1.1rem' }} />
              Across {memberships.length} shop{memberships.length === 1 ? '' : 's'} - keep earning to unlock rewards.
            </p>
          </Card>

          <div className="rail:hidden">
            <LoyaltyCardPanel />
          </div>

          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-section text-text-primary">Neighbourhood shops</h2>
              <Link to="/customer/shops" className="text-label text-primary">
                View all
              </Link>
            </div>
            <SegmentedControl options={SHOP_TABS} value={shopsTab} onChange={setShopsTab} className="mt-3" />

            <div className="mt-4">
              {!stores ? (
                <Card>
                  <SkeletonRow />
                  <SkeletonRow />
                </Card>
              ) : visibleStores.length === 0 ? (
                <EmptyState
                  icon="storefront"
                  title={shopsTab === 'mine' ? 'No shops yet' : "You've joined every shop"}
                  body={shopsTab === 'mine' ? 'Switch to Discover to find one to join.' : 'Check back as new shops arrive.'}
                  action={
                    shopsTab === 'mine' && (
                      <Button size="sm" onClick={() => setShopsTab('discover')}>
                        Discover shops
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="grid gap-4 wide:grid-cols-2">
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
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <div className="hidden rail:block">
            <LoyaltyCardPanel />
          </div>

          <Card>
            <h2 className="text-card-title text-text-primary">Recent activity</h2>
            <div className="mt-2">
              {!transactions ? (
                <SkeletonRow />
              ) : transactions.length === 0 ? (
                <p className="py-3 text-body-sm text-text-secondary">No activity yet.</p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between gap-3 border-b border-divider py-2.5 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium text-text-primary">{getTransactionLabel(transaction.type)}</p>
                      <p className="truncate text-label text-text-muted">
                        {storeNameById[transaction.storeId] || 'Shop'} · {formatDateTime(transaction.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 tabular-nums text-body-sm font-semibold ${
                        transaction.points > 0 ? 'text-success-text' : 'text-error-text'
                      }`}
                    >
                      {formatSignedPoints(transaction.points)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <Link to="/customer/wallet" className="mt-3 block">
              <Button size="sm" variant="secondary" className="w-full">
                View full history
              </Button>
            </Link>
          </Card>

          <TipCard />
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;
