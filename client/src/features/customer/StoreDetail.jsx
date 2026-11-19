import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import * as storesApi from '../../api/stores';
import * as rewardsApi from '../../api/rewards';
import * as redemptionsApi from '../../api/redemptions';
import { useAuth } from '../../shared/hooks/useAuth';
import { showErrorToast, showSuccessToast } from '../../shared/utils/toast';
import { CATEGORY_LABELS } from '../../shared/utils/labels';
import { formatDate } from '../../shared/utils/formatters';
import { getPlaceholderImageUrl } from '../../shared/utils/placeholderImage';
import SegmentedControl from '../../shared/components/SegmentedControl';
import RewardCard from '../../shared/components/RewardCard';
import StampCardProgress from '../../shared/components/StampCardProgress';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Icon from '../../shared/components/Icon';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Pagination from '../../shared/components/Pagination';
import ScrollPanel from '../../shared/components/ScrollPanel';
import { usePaginatedList } from '../../shared/hooks/usePaginatedList';

const REWARDS_PAGE_SIZE = 10;

const TABS = [
  { value: 'rewards', label: 'Rewards' },
  { value: 'earn', label: 'How to earn' },
  { value: 'details', label: 'Details' },
];

const EARN_DESCRIPTION = {
  per_currency: 'Earn points automatically for every pound you spend. Show your code at the till when you pay.',
  per_visit: 'Earn a fixed number of points every time you visit. Show your code at the till on each visit.',
};

// "Stamps" aren't a backend concept - a cosmetic progress view of the real
// balance against the cheapest reward's threshold.
const STAMP_SLOTS = 10;

const StoreDetail = () => {
  const { storeId } = useParams();
  const location = useLocation();
  const { user, refreshProfile } = useAuth();

  const [tab, setTab] = useState('rewards');
  const [store, setStore] = useState(location.state?.store || null);
  const [isLoading, setIsLoading] = useState(!location.state?.store);
  const [cheapestReward, setCheapestReward] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [redeemingReward, setRedeemingReward] = useState(null);
  const [redeemStatus, setRedeemStatus] = useState('idle'); // idle | loading | success
  const [redemptionResult, setRedemptionResult] = useState(null);

  const membership = user?.memberships?.find((item) => item.storeId === storeId);
  const isMember = Boolean(membership);
  const pointsBalance = membership?.pointsBalance ?? 0;

  useEffect(() => {
    if (location.state?.store?._id === storeId) return;
    setIsLoading(true);
    storesApi
      .getPublicStore(storeId)
      .then(setStore)
      .catch(() => setStore(null))
      .finally(() => setIsLoading(false));
    // location.state only seeds the first render - storeId drives refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const fetchRewardsPage = useCallback(
    (page) =>
      rewardsApi
        .listStoreRewards(storeId, { page, limit: REWARDS_PAGE_SIZE })
        .then(({ rewards, pagination }) => ({ items: rewards, pagination })),
    [storeId]
  );
  const {
    items: rewards,
    pagination: rewardsPagination,
    setPage: setRewardsPage,
    isLoading: isLoadingRewards,
    error: rewardsError,
  } = usePaginatedList(fetchRewardsPage);

  // The stamp card tracks progress toward the cheapest reward that's still
  // running. Rewards come back cheapest-first, so the first page is enough.
  useEffect(() => {
    rewardsApi
      .listStoreRewards(storeId, { limit: 20 })
      .then(({ rewards: firstRewards }) => {
        const now = new Date();
        setCheapestReward(firstRewards.find((reward) => !reward.validTo || new Date(reward.validTo) >= now) || null);
      })
      .catch(() => setCheapestReward(null));
  }, [storeId]);

  const filledStamps = cheapestReward
    ? Math.min(STAMP_SLOTS, Math.floor((pointsBalance / cheapestReward.pointsRequired) * STAMP_SLOTS))
    : 0;

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await storesApi.joinStore(storeId);
      showSuccessToast(`You joined ${store.name}.`);
    } catch (err) {
      if (err.code !== 'ALREADY_A_MEMBER') throw err;
    } finally {
      await refreshProfile();
      setIsJoining(false);
    }
  };

  const openRedeemConfirm = (reward) => {
    setRedeemingReward(reward);
    setRedeemStatus('idle');
  };

  const handleConfirmRedeem = async () => {
    setRedeemStatus('loading');
    try {
      const result = await redemptionsApi.initiateRedemption(redeemingReward._id);
      setRedemptionResult(result);
      setRedeemStatus('success');
      await refreshProfile();
    } catch (err) {
      setRedeemStatus('idle');
      showErrorToast(err.message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="py-16" />;
  }

  if (!store) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon="storefront"
          title="Shop not found"
          body="This shop may no longer be listed."
          action={
            <Link to="/customer/shops">
              <Button size="sm">Back to shops</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const directionsUrl = store.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link to="/customer/shops" className="inline-flex items-center gap-1 text-label text-text-secondary hover:text-text-primary">
        <Icon name="arrow_back" style={{ fontSize: '1.1rem' }} />
        Back to shops
      </Link>

      <Card className="mt-4 flex items-center gap-4">
        <img
          src={store.logoUrl || getPlaceholderImageUrl(store.name)}
          alt=""
          className="h-16 w-16 shrink-0 rounded-button object-cover"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-page-title text-text-primary">{store.name}</h1>
          <p className="mt-0.5 truncate text-body-sm text-text-secondary">
            {CATEGORY_LABELS[store.category] || store.category}
            {store.address && ` · ${store.address}`}
          </p>
        </div>
        {isMember && (
          <div className="shrink-0 text-right">
            <p className="text-label text-text-muted">Your points</p>
            <p className="tabular-nums text-amount text-primary">{pointsBalance}</p>
          </div>
        )}
      </Card>

      {!isMember && (
        <Card className="mt-3 flex flex-col gap-3 border-primary bg-primary-tint wide:flex-row wide:items-center wide:justify-between">
          <p className="text-body text-text-primary">Join this shop&apos;s loyalty programme to start earning and redeeming points.</p>
          <Button isLoading={isJoining} onClick={handleJoin} className="shrink-0">
            Join shop
          </Button>
        </Card>
      )}

      {isMember && cheapestReward && (
        <Card className="mt-3 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-card-title text-text-primary">Your stamp card</h2>
              <p className="text-body-sm text-text-secondary">
                {filledStamps === STAMP_SLOTS
                  ? <>Card full - &ldquo;{cheapestReward.title}&rdquo; is ready to redeem.</>
                  : <>Fill it up to unlock &ldquo;{cheapestReward.title}&rdquo;.</>}
              </p>
            </div>
            <span className="whitespace-nowrap font-mono text-caption-mono uppercase text-text-muted">
              {filledStamps}/{STAMP_SLOTS}
            </span>
          </div>
          <StampCardProgress current={filledStamps} total={STAMP_SLOTS} />
        </Card>
      )}

      <SegmentedControl options={TABS} value={tab} onChange={setTab} className="mt-5" />

      <div className="mt-5">
        {tab === 'rewards' &&
          (rewardsError ? (
            <EmptyState icon="block" title="Rewards unavailable" body={rewardsError} />
          ) : isLoadingRewards && rewards.length === 0 ? (
            <LoadingSpinner className="py-8" />
          ) : rewards.length === 0 ? (
            <EmptyState icon="redeem" title="No rewards yet" body="Check back soon." />
          ) : (
            <>
              {/* The shop header sits above, so the list is capped rather than filling the page. */}
              <ScrollPanel resetKey={rewards[0]?._id} className="-mx-1 max-h-[60dvh] px-1 py-1">
                <div
                  className={`grid gap-3 transition-opacity duration-150 wide:grid-cols-2 ${
                    isLoadingRewards ? 'opacity-50' : ''
                  }`}
                >
                  {rewards.map((reward) => (
                    <RewardCard
                      key={reward._id}
                      reward={reward}
                      pointsBalance={pointsBalance}
                      isMember={isMember}
                      onRedeem={openRedeemConfirm}
                    />
                  ))}
                </div>
              </ScrollPanel>
              <Pagination
                pagination={rewardsPagination}
                onPageChange={setRewardsPage}
                isDisabled={isLoadingRewards}
                itemLabel="rewards"
                className="mt-4"
              />
            </>
          ))}

        {tab === 'earn' && (
          <Card className="flex gap-3">
            <Icon name="toll" className="text-primary" />
            <p className="text-body text-text-secondary">
              {EARN_DESCRIPTION[store.loyaltyProgram?.mode] || 'Ask in-store how you earn points here.'}
            </p>
          </Card>
        )}

        {tab === 'details' && (
          <Card className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Icon name="location_on" className="text-primary" />
              <div>
                <p className="text-label text-text-muted">Address</p>
                <p className="text-body text-text-primary">{store.address || 'Not listed'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="storefront" className="text-primary" />
              <div>
                <p className="text-label text-text-muted">Category</p>
                <p className="text-body text-text-primary">{CATEGORY_LABELS[store.category] || store.category}</p>
              </div>
            </div>
            {directionsUrl && (
              <a href={directionsUrl} target="_blank" rel="noreferrer" className="self-start">
                <Button size="sm" variant="secondary">
                  <Icon name="directions" style={{ fontSize: '1.1rem' }} />
                  Get directions
                </Button>
              </a>
            )}
          </Card>
        )}
      </div>

      <Modal
        isOpen={Boolean(redeemingReward)}
        onClose={() => setRedeemingReward(null)}
        title={redeemStatus === 'success' ? 'Your reward code' : 'Confirm redemption'}
      >
        {redeemingReward && redeemStatus !== 'success' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 rounded-card border border-border p-3 text-body-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Balance now</span>
                <span className="tabular-nums text-text-primary">{pointsBalance} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">{redeemingReward.title}</span>
                <span className="tabular-nums text-error-text">-{redeemingReward.pointsRequired} pts</span>
              </div>
              <div className="flex justify-between border-t border-divider pt-1 font-semibold">
                <span className="text-text-primary">Balance after</span>
                <span className="tabular-nums text-text-primary">
                  {pointsBalance - redeemingReward.pointsRequired} pts
                </span>
              </div>
            </div>
            <p className="text-body-sm text-text-secondary">
              You&apos;ll get a code to show at the till. It stays valid until it&apos;s used or expires.
            </p>
            <Button isLoading={redeemStatus === 'loading'} onClick={handleConfirmRedeem}>
              Confirm redemption
            </Button>
          </div>
        )}

        {redeemStatus === 'success' && redemptionResult && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-body text-text-secondary">Show this code at the till to collect your reward.</p>
            <div className="rounded-card border border-border bg-surface p-3">
              <QRCodeSVG value={redemptionResult.redemptionCode} size={200} fgColor="#1C1F16" bgColor="#FFFFFF" />
            </div>
            <p className="break-all font-mono text-body-sm text-text-muted">{redemptionResult.redemptionCode}</p>
            {redemptionResult.expiresAt && (
              <p className="text-body-sm text-text-muted">Valid until {formatDate(redemptionResult.expiresAt)}</p>
            )}
            <Button className="w-full" onClick={() => setRedeemingReward(null)}>
              Done
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StoreDetail;
