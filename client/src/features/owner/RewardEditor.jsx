import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listStoreRewards, createReward, updateReward, deleteReward } from '../../api/rewards';
import { useStore } from './OwnerDashboard';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ListingCard from '../../shared/components/ListingCard';
import { placeholderImageUrl } from '../../shared/utils/placeholderImage';

const REWARD_TYPES = [
  { value: 'free_item', label: 'Free item' },
  { value: 'discount_percent', label: 'Percent discount' },
  { value: 'discount_fixed', label: 'Fixed discount' }
];

const EMPTY_FORM = { title: '', description: '', rewardType: 'free_item', pointsRequired: 100, value: '' };

const inputClass =
  'w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all';
const labelClass = 'font-body text-body-sm text-on-surface-variant ml-xs';

export default function RewardEditor() {
  const { store } = useStore();
  const [rewards, setRewards] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...reward} = editing
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    listStoreRewards(store._id)
      .then(setRewards)
      .catch((err) => toast.error(err.message || 'Could not load rewards'));
  };

  useEffect(load, [store._id]);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditing({});
  };

  const openEdit = (reward) => {
    setForm({
      title: reward.title,
      description: reward.description || '',
      rewardType: reward.rewardType,
      pointsRequired: reward.pointsRequired,
      value: reward.value ?? ''
    });
    setEditing(reward);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        rewardType: form.rewardType,
        pointsRequired: Number(form.pointsRequired),
        value: form.value === '' ? undefined : Number(form.value)
      };
      if (editing._id) {
        await updateReward(store._id, editing._id, payload);
      } else {
        await createReward(store._id, payload);
      }
      setEditing(null);
      load();
      toast.success('Saved');
    } catch (err) {
      toast.error(err.message || 'Could not save reward');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (reward) => {
    try {
      await updateReward(store._id, reward._id, { active: !reward.active });
      load();
    } catch (err) {
      toast.error(err.message || 'Could not update reward');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteReward(store._id, deleteTarget._id);
      setPendingCount(result.pendingRedemptionsCount);
      setDeleteTarget(null);
      load();
      toast.success('Reward removed');
    } catch (err) {
      toast.error(err.message || 'Could not remove reward');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-xl max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-md-mobile md:text-display-md">Rewards</h1>
        <Button onClick={openNew} className="px-xl">
          Add reward
        </Button>
      </div>

      {pendingCount > 0 && (
        <Card className="text-body-sm text-secondary">
          Heads up: {pendingCount} pending redemption{pendingCount === 1 ? '' : 's'} referenced the reward you just
          removed.
        </Card>
      )}

      {!rewards ? (
        <LoadingSpinner />
      ) : rewards.length === 0 ? (
        <Card className="text-body-sm text-on-surface-variant">No rewards yet - add your first one.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {rewards.map((reward) => (
            <ListingCard
              key={reward._id}
              variant="plain"
              className="!w-3/4 mx-auto"
              imageUrl={placeholderImageUrl(reward._id, 480, 240)}
              imageAlt={reward.title}
              title={reward.title}
              subtitle={reward.description}
              cornerBadge={
                <span
                  className={`font-mono text-label-mono px-sm py-2xs rounded-full uppercase ${
                    reward.active
                      ? 'bg-tertiary-container text-on-tertiary-container'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {reward.active ? 'Active' : 'Inactive'}
                </span>
              }
              metaItems={[{ icon: 'toll', text: `${reward.pointsRequired.toLocaleString()} pts` }]}
              titleAction={
                <Button
                  size="sm"
                  variant="danger"
                  className="!w-8 !h-8 !p-0 !rounded-2xl flex items-center justify-center"
                  onClick={() => setDeleteTarget(reward)}
                >
                  <span className="material-symbols-outlined text-body-md">delete</span>
                </Button>
              }
            >
              <div className="flex flex-wrap gap-sm w-full">
                <Button
                  size="sm"
                  variant="text"
                  className="flex-1 min-w-[96px] !rounded-full border border-outline-variant"
                  onClick={() => openEdit(reward)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="text"
                  className="flex-1 min-w-[96px] !rounded-full border border-outline-variant"
                  onClick={() => toggleActive(reward)}
                >
                  {reward.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </ListingCard>
          ))}
        </div>
      )}

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 px-container-margin">
          <Card className="w-full max-w-[480px] max-h-[85vh] overflow-y-auto flex flex-col gap-lg">
            <h2 className="font-display text-headline-sm">{editing._id ? 'Edit reward' : 'New reward'}</h2>
            <div className="space-y-xs">
              <label className={labelClass}>Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Free coffee of any size"
                className={inputClass}
              />
            </div>
            <div className="space-y-xs">
              <label className={labelClass}>Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional"
                className={inputClass}
              />
            </div>
            <div className="space-y-xs">
              <label className={labelClass}>Type</label>
              <select
                value={form.rewardType}
                onChange={(e) => setForm({ ...form, rewardType: e.target.value })}
                className={inputClass}
              >
                {REWARD_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {form.rewardType !== 'free_item' && (
              <div className="space-y-xs">
                <label className={labelClass}>
                  {form.rewardType === 'discount_percent' ? 'Discount (%)' : 'Discount amount ($)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className={inputClass}
                />
              </div>
            )}
            <div className="space-y-xs">
              <label className={labelClass}>Points required</label>
              <input
                type="number"
                min="1"
                value={form.pointsRequired}
                onChange={(e) => setForm({ ...form, pointsRequired: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex gap-md">
              <Button variant="text" className="flex-1 border border-outline-variant" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button className="flex-1" loading={saving} onClick={handleSave}>
                Save
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={Boolean(deleteTarget)}
        title="Remove this reward?"
        confirmText="Remove"
        confirmVariant="danger"
        confirming={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        This soft-deletes the reward - it stops appearing anywhere, but any existing redemption records are kept for
        audit history.
      </Modal>
    </div>
  );
}
