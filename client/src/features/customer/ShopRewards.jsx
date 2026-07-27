import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listStores, joinStore } from '../../api/stores';
import { listStoreRewards } from '../../api/rewards';
import { initiateRedemption } from '../../api/redemptions';
import { useCustomer } from './CustomerDashboard';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ListingCard from '../../shared/components/ListingCard';
import { placeholderImageUrl } from '../../shared/utils/placeholderImage';
import { formatDate } from '../../shared/utils/formatters';

const CATEGORY_LABELS = { cafe: 'Cafe', retail: 'Retail', services: 'Services', other: 'Other' };
const STAMP_SLOTS = 10;

export default function ShopRewards() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { me, refetch } = useCustomer();
  const [store, setStore] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [confirmReward, setConfirmReward] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redemption, setRedemption] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    listStores()
      .then((all) => {
        const match = all.find((s) => s._id === storeId);
        if (!match) {
          toast.error('Shop not found');
          navigate('/customer/shops', { replace: true });
          return;
        }
        setStore(match);
      })
      .catch((err) => toast.error(err.message || 'Could not load this shop'));

    listStoreRewards(storeId)
      .then(setRewards)
      .catch((err) => toast.error(err.message || 'Could not load rewards'));
  }, [storeId, navigate]);

  const membership = me.memberships.find((m) => m.storeId === storeId);
  const isMember = Boolean(membership);
  const balance = membership?.pointsBalance || 0;

  const cheapestReward = useMemo(() => {
    if (!rewards || rewards.length === 0) return null;
    return [...rewards].sort((a, b) => a.pointsRequired - b.pointsRequired)[0];
  }, [rewards]);

  // "Stamps" aren't a real backend concept - this is a cosmetic progress
  // visual (matching the design mockup's stamp card) derived from the real
  // pointsBalance vs the cheapest reward's threshold.
  const filledStamps = cheapestReward
    ? Math.min(STAMP_SLOTS, Math.floor((balance / cheapestReward.pointsRequired) * STAMP_SLOTS))
    : 0;

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinStore(storeId);
      await refetch();
      toast.success('Joined!');
    } catch (err) {
      toast.error(err.message || 'Could not join this shop');
    } finally {
      setJoining(false);
    }
  };

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      const result = await initiateRedemption(confirmReward._id);
      setRedemption(result);
      setConfirmReward(null);
      await refetch();
    } catch (err) {
      toast.error(err.message || 'Could not redeem this reward');
    } finally {
      setRedeeming(false);
    }
  };

  if (!store || !rewards) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="flex flex-col gap-xl max-w-[1100px] mx-auto">
      <button
        type="button"
        onClick={() => navigate('/customer/shops')}
        className="flex items-center gap-xs text-on-surface-variant hover:text-on-surface hover:scale-105 transition-all w-fit"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        Back to shops
      </button>

      {/* Hero */}
      <section className="relative h-64 md:h-[340px] w-full rounded-xl overflow-hidden elevation-l1 group">
        <img
          alt={`${store.name} storefront`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          src={placeholderImageUrl(store._id, 1200, 700)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-lg left-lg right-lg flex justify-between items-end">
          <div className="text-white">
            <h1 className="font-display text-display-md-mobile md:text-display-md">{store.name}</h1>
            <div className="flex items-center gap-xs mt-xs">
              <span className="material-symbols-outlined text-[16px] text-secondary-container">storefront</span>
              <span className="text-body-sm font-bold">{CATEGORY_LABELS[store.category] || store.category}</span>
              {store.address && <span className="text-body-sm opacity-90">&middot; {store.address}</span>}
            </div>
          </div>
          <div className="bg-surface rounded-xl p-md flex flex-col items-center elevation-l2 shrink-0">
            <span className="font-mono text-label-mono text-on-surface-variant uppercase">Your points</span>
            <span className="font-display text-display-md text-primary">{balance.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {!isMember && (
        <Card className="flex items-center justify-between">
          <p className="text-body-md">Join this shop's loyalty program to start earning and redeeming points.</p>
          <Button loading={joining} onClick={handleJoin} className="px-xl shrink-0">
            Join
          </Button>
        </Card>
      )}

      {isMember && cheapestReward && (
        <section className="bg-surface-container-low rounded-xl p-xl border border-outline-variant/30">
          <div className="flex justify-between items-center mb-lg gap-md">
            <div>
              <h3 className="font-display text-headline-sm text-primary">Your stamp card</h3>
              <p className="text-body-sm text-on-surface-variant">
                Fill it up to unlock "{cheapestReward.title}".
              </p>
            </div>
            <span className="bg-secondary-container/20 text-on-secondary-container px-md py-xs rounded-full font-mono text-label-mono whitespace-nowrap">
              {filledStamps} / {STAMP_SLOTS} STAMPS
            </span>
          </div>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-md">
            {Array.from({ length: STAMP_SLOTS }).map((_, i) => (
              <div
                key={i}
                className={
                  i < filledStamps
                    ? 'aspect-square rounded-full bg-secondary-container flex items-center justify-center elevation-l1 hover:scale-110 transition-transform'
                    : 'aspect-square rounded-full stamp-slot flex items-center justify-center opacity-40'
                }
              >
                <span
                  className={`material-symbols-outlined ${i < filledStamps ? 'text-on-secondary-container' : 'text-on-surface-variant text-[20px]'}`}
                >
                  {i < filledStamps ? 'favorite' : i === STAMP_SLOTS - 1 ? 'redeem' : ''}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-lg">
        <div className="flex items-baseline gap-md">
          <h2 className="font-display text-headline-sm text-primary">Redeem rewards</h2>
          <div className="h-px flex-1 bg-outline-variant/30" />
        </div>
        {rewards.length === 0 ? (
          <Card className="text-body-sm text-on-surface-variant">No rewards available yet.</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
            {rewards.map((reward) => {
              const canAfford = isMember && balance >= reward.pointsRequired;
              return (
                <ListingCard
                  key={reward._id}
                  variant="plain"
                  imageUrl={placeholderImageUrl(reward._id, 480, 320)}
                  imageAlt={reward.title}
                  title={reward.title}
                  subtitle={reward.description}
                  metaItems={[{ icon: 'toll', text: `${reward.pointsRequired.toLocaleString()} pts` }]}
                >
                  <Button
                    size="sm"
                    disabled={!canAfford}
                    onClick={() => setConfirmReward(reward)}
                    className="w-full !rounded-full"
                  >
                    {canAfford ? 'Redeem' : isMember ? 'Not enough points' : 'Join to redeem'}
                  </Button>
                </ListingCard>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-xl">
        <Card className="md:col-span-2 flex flex-col gap-md">
          <h3 className="font-display text-headline-sm text-primary">Store information</h3>
          {store.address && (
            <div className="flex items-start gap-md">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <p className="text-body-md">{store.address}</p>
            </div>
          )}
          <div className="flex items-start gap-md">
            <span className="material-symbols-outlined text-primary">storefront</span>
            <p className="text-body-md">{CATEGORY_LABELS[store.category] || store.category}</p>
          </div>
        </Card>
        <div className="rounded-xl overflow-hidden elevation-l1 h-full min-h-[200px] relative group">
          <img
            alt="Map preview"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={placeholderImageUrl(`map-${store._id}`, 400, 300)}
          />
          <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
          {store.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-md left-1/2 -translate-x-1/2 bg-surface px-lg py-sm rounded-full text-body-sm font-semibold text-primary elevation-l2 hover:scale-105 transition-transform flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">directions</span>
              Get directions
            </a>
          )}
        </div>
      </section>

      <Modal
        open={Boolean(confirmReward)}
        title="Redeem this reward?"
        confirmText="Redeem"
        confirming={redeeming}
        onConfirm={handleRedeem}
        onCancel={() => setConfirmReward(null)}
      >
        {confirmReward && (
          <p>
            This will use {confirmReward.pointsRequired.toLocaleString()} points for "{confirmReward.title}". Show
            the resulting code at checkout - it stays valid for a year, or until it's used.
          </p>
        )}
      </Modal>

      {redemption && <RedemptionCodeModal redemption={redemption} onClose={() => setRedemption(null)} />}
    </div>
  );
}

function RedemptionCodeModal({ redemption, onClose }) {
  const expired = new Date(redemption.expiresAt) < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 px-container-margin">
      <Card className="w-full max-w-[400px] flex flex-col items-center gap-lg text-center">
        <p className="font-body text-body-sm font-semibold text-on-surface-variant uppercase">
          {expired ? 'Code expired' : 'Show this code at checkout'}
        </p>
        <p className="font-mono text-display-md tracking-[0.1em]">{redemption.redemptionCode}</p>
        {!expired && (
          <p className="text-body-sm text-on-surface-variant">Valid until {formatDate(redemption.expiresAt)}</p>
        )}
        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </Card>
    </div>
  );
}
