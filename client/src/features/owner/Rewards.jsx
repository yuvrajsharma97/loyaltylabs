import { useCallback, useState } from 'react';
import * as rewardsApi from '../../api/rewards';
import { useAuth } from '../../shared/hooks/useAuth';
import { usePaginatedList } from '../../shared/hooks/usePaginatedList';
import Pagination from '../../shared/components/Pagination';
import TextArea from '../../shared/components/TextArea';
import {
  LIMITS,
  NUMBER_RULES,
  hasErrors,
  sanitizeDecimal,
  sanitizeInteger,
  validateNumber,
  validateText,
  validateTitle,
} from '../../shared/utils/validation';
import ListPage from '../../shared/components/ListPage';
import ScrollPanel from '../../shared/components/ScrollPanel';
import { showSuccessToast } from '../../shared/utils/toast';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Modal from '../../shared/components/Modal';
import Input from '../../shared/components/Input';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Icon from '../../shared/components/Icon';
import IconButton from '../../shared/components/IconButton';

const PAGE_SIZE = 10;

const REWARD_TYPES = [
  { value: 'free_item', label: 'Free item' },
  { value: 'discount_percent', label: 'Percent off' },
  { value: 'discount_fixed', label: 'Fixed amount off' },
];

function getRewardStatus(reward) {
  const now = new Date();
  if (!reward.active) return { label: 'Paused', tone: 'neutral' };
  if (reward.validTo && new Date(reward.validTo) < now) return { label: 'Ended', tone: 'warning' };
  if (reward.validFrom && new Date(reward.validFrom) > now) return { label: 'Scheduled', tone: 'info' };
  return { label: 'Active', tone: 'success' };
}

function describeReward(reward) {
  if (reward.rewardType === 'discount_percent') return `${reward.value}% off`;
  if (reward.rewardType === 'discount_fixed') return `£${reward.value} off`;
  return 'Free item';
}

// Numbers are edited as strings and converted on save.
const EMPTY_FORM = { title: '', description: '', pointsRequired: '100', rewardType: 'free_item', value: '' };

function validateRewardForm(form) {
  return {
    title: validateTitle(form.title, { label: 'Title', max: LIMITS.rewardTitle }),
    description: validateText(form.description, { label: 'Description', max: LIMITS.rewardDescription }),
    pointsRequired: validateNumber(form.pointsRequired, NUMBER_RULES.rewardPoints),
    value:
      form.rewardType === 'discount_percent'
        ? validateNumber(form.value, NUMBER_RULES.percentOff)
        : form.rewardType === 'discount_fixed'
          ? validateNumber(form.value, NUMBER_RULES.amountOff)
          : null,
  };
}

const Rewards = () => {
  const { user: store } = useAuth();
  const [editingReward, setEditingReward] = useState(null); // null = closed, {} = new, {...} = editing
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [deletingReward, setDeletingReward] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingNotice, setPendingNotice] = useState(null); // { title, count } after deleting a reward with open codes

  const fetchPage = useCallback(
    (page) =>
      rewardsApi
        .listStoreRewards(store._id, { page, limit: PAGE_SIZE })
        .then(({ rewards, pagination }) => ({ items: rewards, pagination })),
    [store._id]
  );
  const { items: rewards, pagination, setPage, isLoading, reload: loadRewards } = usePaginatedList(fetchPage);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingReward({});
  };

  const openEdit = (reward) => {
    setForm({
      title: reward.title,
      description: reward.description || '',
      pointsRequired: String(reward.pointsRequired),
      rewardType: reward.rewardType,
      value: reward.value === null || reward.value === undefined ? '' : String(reward.value),
    });
    setFormErrors({});
    setEditingReward(reward);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const errors = validateRewardForm(form);
    setFormErrors(errors);
    if (hasErrors(errors)) return;

    setIsSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        pointsRequired: Number(form.pointsRequired),
        rewardType: form.rewardType,
        value: form.rewardType === 'free_item' ? undefined : Number(form.value),
      };

      if (editingReward._id) {
        await rewardsApi.updateReward(store._id, editingReward._id, payload);
      } else {
        await rewardsApi.createReward(store._id, payload);
      }
      setEditingReward(null);
      loadRewards();
      showSuccessToast('Reward saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (reward) => {
    await rewardsApi.updateReward(store._id, reward._id, { active: !reward.active });
    loadRewards();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { pendingRedemptionsCount } = await rewardsApi.deleteReward(store._id, deletingReward._id);
      setPendingNotice(pendingRedemptionsCount > 0 ? { title: deletingReward.title, count: pendingRedemptionsCount } : null);
      setDeletingReward(null);
      loadRewards();
      showSuccessToast('Reward removed.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && !pagination) {
    return <LoadingSpinner className="py-16" />;
  }

  const header = (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-page-title text-text-primary">Rewards</h1>
        <Button size="sm" onClick={openCreate}>
          New reward
        </Button>
      </div>

      {pendingNotice && (
        <Card className="mt-5 flex items-start gap-3 border-warning bg-warning-bg">
          <Icon name="warning" className="text-warning" />
          <p className="flex-1 text-body-sm text-warning-text">
            {pendingNotice.count} customer{pendingNotice.count === 1 ? ' still has an' : 's still have'} unredeemed
            code{pendingNotice.count === 1 ? '' : 's'} for &ldquo;{pendingNotice.title}&rdquo;. They can still be
            fulfilled at the till until they expire.
          </p>
          <IconButton label="Dismiss" onClick={() => setPendingNotice(null)}>
            <Icon name="close" />
          </IconButton>
        </Card>
      )}
    </>
  );

  return (
    <ListPage
      header={header}
      footer={<Pagination pagination={pagination} onPageChange={setPage} isDisabled={isLoading} itemLabel="rewards" />}
    >
      <ScrollPanel resetKey={rewards[0]?._id} className="-mx-1 flex-1 px-1 py-1">
        <div className={`flex flex-col gap-3 transition-opacity duration-150 ${isLoading ? 'opacity-50' : ''}`}>
          {rewards.length === 0 && <EmptyState icon="redeem" title="No rewards yet" body="Add your first reward to get started." />}

          {rewards.map((reward) => {
            const status = getRewardStatus(reward);
            return (
              <Card key={reward._id} className="flex flex-col gap-3 wide:flex-row wide:items-center wide:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-card-title text-text-primary">{reward.title}</p>
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {reward.stockLimit != null && <Badge tone="info">{reward.stockLimit} in stock</Badge>}
                  </div>
                  <p className="mt-0.5 text-body-sm text-text-secondary">
                    <span className="tabular-nums">{reward.pointsRequired} pts</span> · {describeReward(reward)}
                  </p>
                  {reward.description && <p className="mt-0.5 text-body-sm text-text-muted">{reward.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleToggleActive(reward)}>
                    {reward.active ? 'Pause' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(reward)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" aria-label="Delete reward" onClick={() => setDeletingReward(reward)}>
                    <Icon name="delete" style={{ fontSize: '1.1rem' }} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollPanel>

      <Modal isOpen={Boolean(deletingReward)} onClose={() => setDeletingReward(null)} title="Remove this reward?">
        <div className="flex flex-col gap-4">
          <p className="text-body text-text-secondary">
            &ldquo;{deletingReward?.title}&rdquo; will stop appearing to customers. Past redemption records are kept for
            your history.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeletingReward(null)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" isLoading={isDeleting} onClick={handleDelete}>
              Remove reward
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(editingReward)} onClose={() => setEditingReward(null)} title={editingReward?._id ? 'Edit reward' : 'New reward'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4" noValidate>
          <Input
            label="Title"
            placeholder="Free coffee"
            maxLength={LIMITS.rewardTitle}
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
            error={formErrors.title}
          />
          <TextArea
            label="Description (optional)"
            rows={2}
            maxLength={LIMITS.rewardDescription}
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
            error={formErrors.description}
          />
          <Input
            label="Points required"
            inputMode="numeric"
            value={form.pointsRequired}
            onChange={(event) => setField('pointsRequired', sanitizeInteger(event.target.value))}
            error={formErrors.pointsRequired}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reward-type" className="text-label text-text-secondary">
              Reward type
            </label>
            <select
              id="reward-type"
              value={form.rewardType}
              onChange={(event) => {
                // The value's meaning changes with the type, so start it fresh.
                setForm((current) => ({ ...current, rewardType: event.target.value, value: '' }));
                setFormErrors((current) => ({ ...current, value: undefined }));
              }}
              className="h-11 rounded-input border border-border bg-surface px-3 text-body text-text-primary outline-none focus:border-primary"
            >
              {REWARD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          {form.rewardType !== 'free_item' && (
            <Input
              label={form.rewardType === 'discount_percent' ? 'Percent off' : 'Amount off (£)'}
              inputMode={form.rewardType === 'discount_percent' ? 'numeric' : 'decimal'}
              placeholder={form.rewardType === 'discount_percent' ? '10' : '5.00'}
              value={form.value}
              onChange={(event) =>
                setField(
                  'value',
                  form.rewardType === 'discount_percent'
                    ? sanitizeInteger(event.target.value, 3)
                    : sanitizeDecimal(event.target.value, { maxIntegerDigits: 5 })
                )
              }
              error={formErrors.value}
              hint={form.rewardType === 'discount_percent' ? 'Between 1 and 100.' : undefined}
            />
          )}
          <Button type="submit" isLoading={isSaving}>
            Save reward
          </Button>
        </form>
      </Modal>
    </ListPage>
  );
};

export default Rewards;
