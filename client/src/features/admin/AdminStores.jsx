import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listStores, updateStoreStatus, reconcileStore } from '../../api/admin';
import Card from '../../shared/components/Card';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { formatDate } from '../../shared/utils/formatters';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' }
];

export default function AdminStores() {
  const [status, setStatus] = useState('all');
  const [stores, setStores] = useState(null);
  const [statusChange, setStatusChange] = useState(null); // { store, nextStatus }
  const [reconciling, setReconciling] = useState(null); // store
  const [reconcileResult, setReconcileResult] = useState(null); // { discrepancies, requiresConfirm }
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    listStores({ status: status === 'all' ? undefined : status })
      .then(setStores)
      .catch((err) => toast.error(err.message || 'Could not load stores'));
  };

  useEffect(load, [status]);

  const handleStatusChange = async () => {
    setSubmitting(true);
    try {
      await updateStoreStatus(statusChange.store._id, statusChange.nextStatus);
      setStatusChange(null);
      load();
      toast.success(statusChange.nextStatus === 'suspended' ? 'Store suspended' : 'Store reactivated');
    } catch (err) {
      toast.error(err.message || 'Could not update store status');
    } finally {
      setSubmitting(false);
    }
  };

  const startReconcile = async (store) => {
    setReconciling(store);
    try {
      const result = await reconcileStore(store._id, false);
      if (!result.requiresConfirm) {
        toast.success('No discrepancies found');
        setReconciling(null);
        return;
      }
      setReconcileResult(result);
    } catch (err) {
      toast.error(err.message || 'Could not run reconciliation');
      setReconciling(null);
    }
  };

  const confirmReconcile = async () => {
    setSubmitting(true);
    try {
      const { corrected } = await reconcileStore(reconciling._id, true);
      toast.success(`Corrected ${corrected} discrepanc${corrected === 1 ? 'y' : 'ies'}`);
      setReconciling(null);
      setReconcileResult(null);
    } catch (err) {
      toast.error(err.message || 'Could not apply corrections');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-xl max-w-[1100px] mx-auto">
      <h1 className="font-display text-display-md-mobile md:text-display-md">Stores</h1>

      <div className="flex rounded-lg bg-surface-container-low p-1 gap-1 w-fit">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`px-xl py-sm rounded-md font-body text-body-sm font-semibold transition-colors ${
              status === value ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!stores ? (
        <LoadingSpinner />
      ) : stores.length === 0 ? (
        <Card className="text-body-sm text-on-surface-variant">No stores found.</Card>
      ) : (
        <div className="flex flex-col gap-md">
          {stores.map((store) => (
            <Card key={store._id} className="flex flex-col sm:flex-row items-start justify-between gap-lg">
              <div className="flex flex-col gap-xs flex-1 min-w-0">
                <div className="flex items-center gap-sm">
                  <p className="font-body text-body-md font-semibold">{store.name}</p>
                  <span
                    className={`font-mono text-label-mono uppercase px-xs py-[2px] rounded ${
                      store.status === 'active'
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    {store.status}
                  </span>
                </div>
                <p className="text-body-sm text-on-surface-variant">Created {formatDate(store.createdAt)}</p>
              </div>
              <div className="flex gap-md shrink-0">
                <Button size="sm" variant="text" onClick={() => startReconcile(store)}>
                  Reconcile
                </Button>
                <Button
                  size="sm"
                  variant={store.status === 'active' ? 'danger' : 'primary'}
                  onClick={() =>
                    setStatusChange({
                      store,
                      nextStatus: store.status === 'active' ? 'suspended' : 'active'
                    })
                  }
                >
                  {store.status === 'active' ? 'Suspend' : 'Reactivate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(statusChange)}
        title={statusChange?.nextStatus === 'suspended' ? 'Suspend this store?' : 'Reactivate this store?'}
        confirmText={statusChange?.nextStatus === 'suspended' ? 'Suspend' : 'Reactivate'}
        confirmVariant={statusChange?.nextStatus === 'suspended' ? 'danger' : 'primary'}
        confirming={submitting}
        onConfirm={handleStatusChange}
        onCancel={() => setStatusChange(null)}
      >
        {statusChange?.nextStatus === 'suspended'
          ? 'Pending redemptions will be cancelled and points restored. This can be reversed later.'
          : 'This store will become active again immediately.'}
      </Modal>

      <Modal
        open={Boolean(reconciling) && Boolean(reconcileResult)}
        title="Discrepancies found"
        confirmText="Apply corrections"
        confirming={submitting}
        onConfirm={confirmReconcile}
        onCancel={() => {
          setReconciling(null);
          setReconcileResult(null);
        }}
      >
        {reconcileResult?.discrepancies.length} customer balance
        {reconcileResult?.discrepancies.length === 1 ? '' : 's'} out of sync with the ledger for{' '}
        {reconciling?.name}. Apply corrections to fix them?
      </Modal>
    </div>
  );
}
