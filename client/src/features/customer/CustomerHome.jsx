import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { listStores, joinStore } from '../../api/stores';
import { getTransactions, getQrToken } from '../../api/customer';
import { useCustomer } from './CustomerDashboard';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { formatDate, formatPoints } from '../../shared/utils/formatters';
import ShopCard from './ShopCard';

// Full class strings (not built via template interpolation) so Tailwind's
// static source scan actually picks them up.
const TYPE_ICONS = {
  earn: { icon: 'coffee', bgClass: 'bg-primary/10', textClass: 'text-primary' },
  redeem: { icon: 'redeem', bgClass: 'bg-secondary/10', textClass: 'text-secondary' },
  adjust: { icon: 'tune', bgClass: 'bg-secondary/10', textClass: 'text-secondary' },
  reversal: { icon: 'undo', bgClass: 'bg-secondary/10', textClass: 'text-secondary' },
  expiry: { icon: 'schedule', bgClass: 'bg-error/10', textClass: 'text-error' },
  suspension_reversal: { icon: 'undo', bgClass: 'bg-secondary/10', textClass: 'text-secondary' }
};
const TYPE_LABELS = {
  earn: 'Earned points',
  redeem: 'Redeemed reward',
  adjust: 'Balance adjusted',
  reversal: 'Reversed',
  expiry: 'Points expired',
  suspension_reversal: 'Reversed (suspension)'
};

// Rendered twice (see below) so it can sit before "Featured shops" on
// mobile but stay in its original spot (after Recent history) on desktop,
// without duplicating the copy itself.
function TipCard({ className = '' }) {
  return (
    <Card className={`!bg-primary elevation-l1 shadow-none relative overflow-hidden ${className}`}>
      <div className="relative z-10 flex flex-col gap-sm">
        <span className="bg-secondary-container text-on-secondary-container text-[10px] font-extrabold uppercase px-sm py-2xs rounded w-fit tracking-widest">
          Tip
        </span>
        <h3 className="text-on-primary font-display text-body-lg">Keep your streak going</h3>
        <p className="text-on-primary/80 text-xs">
          Visit your favorite shops regularly to earn points faster and unlock more rewards.
        </p>
      </div>
      <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
        <span className="material-symbols-outlined text-on-primary" style={{ fontSize: 160 }}>
          redeem
        </span>
      </div>
    </Card>
  );
}

export default function CustomerHome() {
  const { me } = useCustomer();
  const [stores, setStores] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [joiningId, setJoiningId] = useState(null);
  const [joinedIds, setJoinedIds] = useState(() => new Set(me.memberships.map((m) => m.storeId)));
  const [qrToken, setQrToken] = useState(null);
  const [qrError, setQrError] = useState(null);
  const [shopsTab, setShopsTab] = useState('subscribed');

  useEffect(() => {
    listStores()
      .then(setStores)
      .catch((err) => toast.error(err.message || 'Could not load nearby shops'));

    getTransactions({ limit: 5 })
      .then((res) => setTransactions(res.transactions))
      .catch((err) => toast.error(err.message || 'Could not load recent activity'));

    getQrToken()
      .then((data) => setQrToken(data.qrToken))
      .catch((err) => setQrError(err));
  }, []);

  const totalBalance = me.memberships.reduce((sum, m) => sum + m.pointsBalance, 0);

  const subscribedStores = (stores || []).filter((s) => joinedIds.has(s._id)).slice(0, 2);
  const unsubscribedStores = (stores || []).filter((s) => !joinedIds.has(s._id)).slice(0, 2);

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl max-w-[1400px]">
      {/* Left column: balance + QR */}
      <section className="lg:col-span-3 flex flex-col gap-xl">
        <Card className="elevation-l1 shadow-none flex flex-col gap-sm">
          <span className="text-on-surface-variant text-body-sm uppercase tracking-wider">Total balance</span>
          <div className="flex items-baseline gap-xs">
            <span className="font-mono text-primary text-[48px] leading-none">
              {totalBalance.toLocaleString()}
            </span>
            <span className="text-primary font-bold">PTS</span>
          </div>
          <div className="mt-md bg-secondary-container/10 p-sm rounded-lg flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary text-sm">trending_up</span>
            <span className="text-xs font-medium text-secondary">Keep earning to unlock more rewards</span>
          </div>
        </Card>

        <Card className="elevation-l1 shadow-none flex flex-col items-center gap-lg">
          <h2 className="font-display text-headline-sm text-center">Your loyalty card</h2>
          {qrError ? (
            <p className="text-body-sm text-center text-on-surface-variant px-md">
              {qrError.code === 'QR_NOT_ISSUED'
                ? 'Verify your email to activate your loyalty QR code.'
                : qrError.message || 'Could not load your QR code'}
            </p>
          ) : !qrToken ? (
            <LoadingSpinner />
          ) : (
            <Link
              to="/customer/scan"
              className="relative p-md bg-white rounded-lg border-2 border-dashed border-outline-variant hover:scale-[1.03] hover:shadow-lg transition-all duration-300"
            >
              <QRCodeSVG value={qrToken} size={180} />
              <div className="absolute inset-0 bg-primary/5 pointer-events-none rounded-lg" />
            </Link>
          )}
          <p className="text-body-sm text-center text-on-surface-variant px-md">
            Scan at checkout to earn points or redeem active rewards.
          </p>
        </Card>
      </section>

      {/* Mobile-only: Tip card shown here so it appears before Featured
          shops in the single-column stack - hidden at lg+, where the
          original copy below (in the right column) takes over instead. */}
      <TipCard className="lg:hidden" />

      {/* Center column: featured shops */}
      <section className="lg:col-span-6 flex flex-col gap-lg">
        <div className="bg-secondary-container p-lg rounded-xl flex items-center gap-md shadow-sm">
          <span className="material-symbols-outlined text-on-secondary-container">stars</span>
          <p className="font-bold text-on-secondary-container text-body-md">
            Explore your neighborhood - join a shop's loyalty program to start earning.
          </p>
        </div>

        <div className="border border-outline-variant rounded-xl p-lg md:p-xl flex flex-col items-center text-center gap-xs">
          <h2 className="font-display text-display-md-mobile md:text-display-md">Featured neighborhood shops</h2>
          <Link to="/customer/shops" className="text-primary font-bold text-body-sm hover:underline">
            View all
          </Link>
        </div>

        {!stores ? (
          <LoadingSpinner />
        ) : (
          <div className="flex flex-col gap-lg">
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

            {shopsTab === 'subscribed' ? (
              subscribedStores.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">
                  You haven't joined any shops yet - switch to "Discover more" to find one.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    {subscribedStores.map((store) => (
                      <ShopCard key={store._id} store={store} isJoined className="!w-3/4 mx-auto" />
                    ))}
                  </div>
                  <Link to="/customer/shops" className="w-fit self-center">
                    <Button variant="text" className="!rounded-full border-2 border-primary !text-primary px-xl">
                      View all shops
                    </Button>
                  </Link>
                </>
              )
            ) : unsubscribedStores.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">You've joined every featured shop so far.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  {unsubscribedStores.map((store) => (
                    <ShopCard
                      key={store._id}
                      store={store}
                      isJoined={false}
                      joining={joiningId === store._id}
                      onJoin={() => handleJoin(store._id)}
                      className="!w-3/4 mx-auto"
                    />
                  ))}
                </div>
                <Link to="/customer/shops" className="w-fit self-center">
                  <Button variant="text" className="!rounded-full border-2 border-primary !text-primary px-xl">
                    View all shops
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </section>

      {/* Right column: recent history + promo */}
      <section className="lg:col-span-3 flex flex-col gap-xl">
        <Card className="elevation-l1 shadow-none">
          <h2 className="font-display text-body-lg font-bold mb-lg">Recent history</h2>
          {!transactions ? (
            <LoadingSpinner />
          ) : transactions.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">No activity yet.</p>
          ) : (
            <div className="flex flex-col gap-lg">
              {transactions.map((tx) => {
                const meta = TYPE_ICONS[tx.type] || {
                  icon: 'receipt_long',
                  bgClass: 'bg-secondary/10',
                  textClass: 'text-secondary'
                };
                return (
                  <div
                    key={tx._id}
                    className="flex items-center gap-md group cursor-default hover:bg-surface-container-low p-sm -mx-sm rounded-lg transition-all"
                  >
                    <div className={`w-10 h-10 rounded-full ${meta.bgClass} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined ${meta.textClass} text-lg`}>{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{TYPE_LABELS[tx.type] || tx.type}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${tx.points >= 0 ? 'text-tertiary' : 'text-error'}`}>
                        {formatPoints(tx.points)}
                      </p>
                      <p className="text-[10px] text-on-surface-variant uppercase">Points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link to="/customer/wallet">
            <Button variant="text" className="w-full mt-xl border border-outline-variant text-sm">
              View full history
            </Button>
          </Link>
        </Card>

        <TipCard className="hidden lg:block" />
      </section>
    </div>
  );
}
