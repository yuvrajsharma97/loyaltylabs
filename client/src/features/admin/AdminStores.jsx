import { useCallback, useState } from 'react';
import * as adminApi from '../../api/admin';
import { usePaginatedList } from '../../shared/hooks/usePaginatedList';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import Pagination from '../../shared/components/Pagination';
import ListPage from '../../shared/components/ListPage';
import ScrollPanel from '../../shared/components/ScrollPanel';
import SearchInput from '../../shared/components/SearchInput';
import { showSuccessToast } from '../../shared/utils/toast';
import SegmentedControl from '../../shared/components/SegmentedControl';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import EmptyState from '../../shared/components/EmptyState';
import Avatar from '../../shared/components/Avatar';
import { formatDate } from '../../shared/utils/formatters';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const PAGE_SIZE = 10;

const AdminStores = () => {
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [reconcilingStore, setReconcilingStore] = useState(null);
  const [discrepancies, setDiscrepancies] = useState(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [statusChange, setStatusChange] = useState(null); // { store, nextStatus }
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const search = useDebouncedValue(query.trim());

  const fetchPage = useCallback(
    (page) =>
      adminApi
        .listStores({ status: status || undefined, search: search || undefined, page, limit: PAGE_SIZE })
        .then(({ stores, pagination }) => ({ items: stores, pagination })),
    [status, search]
  );
  const { items: stores, pagination, setPage, isLoading, reload: loadStores } = usePaginatedList(fetchPage);

  const handleConfirmStatusChange = async () => {
    const { store, nextStatus } = statusChange;
    setIsChangingStatus(true);
    try {
      await adminApi.updateStoreStatus(store._id, nextStatus);
      setStatusChange(null);
      loadStores();
      showSuccessToast(nextStatus === 'suspended' ? `${store.name} suspended.` : `${store.name} reactivated.`);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const openReconcile = async (store) => {
    setReconcilingStore(store);
    setDiscrepancies(null);
    try {
      const result = await adminApi.reconcileStore(store._id, { confirm: false });
      setDiscrepancies(result.discrepancies);
    } catch (err) {
      setReconcilingStore(null);
      throw err;
    }
  };

  const handleConfirmReconcile = async () => {
    setIsReconciling(true);
    try {
      const result = await adminApi.reconcileStore(reconcilingStore._id, { confirm: true });
      showSuccessToast(`Corrected ${result.corrected} balance(s).`);
      setReconcilingStore(null);
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <ListPage
      maxWidthClassName="max-w-3xl"
      header={
        <>
          <h1 className="text-page-title text-text-primary">Stores</h1>
          <div className="mt-4 flex flex-col gap-3 wide:flex-row wide:items-center">
            <div className="wide:flex-1">
              <SearchInput
                placeholder="Search stores by name"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <SegmentedControl options={STATUS_FILTERS} value={status} onChange={setStatus} />
          </div>
        </>
      }
      footer={<Pagination pagination={pagination} onPageChange={setPage} isDisabled={isLoading} itemLabel="stores" />}
    >
      {isLoading && stores.length === 0 && <LoadingSpinner className="py-16" />}

      <ScrollPanel resetKey={stores[0]?._id} className="-mx-1 flex-1 px-1 py-1">
        <div className={`flex flex-col gap-3 transition-opacity duration-150 ${isLoading ? 'opacity-50' : ''}`}>
          {!isLoading && stores.length === 0 && <EmptyState icon="storefront" title="No stores found" />}

          {stores.map((store) => (
            <Card key={store._id} className="flex flex-col gap-3 wide:flex-row wide:items-center wide:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={store.name} shape="square" imageUrl={store.logoUrl} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-card-title text-text-primary">{store.name}</p>
                    <Badge tone={store.status === 'active' ? 'success' : 'error'}>{store.status}</Badge>
                  </div>
                  <p className="truncate text-body-sm text-text-secondary">
                    {[store.address, `Created ${formatDate(store.createdAt)}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => openReconcile(store)}>
                  Reconcile
                </Button>
                <Button
                  size="sm"
                  variant={store.status === 'active' ? 'danger' : 'primary'}
                  onClick={() =>
                    setStatusChange({ store, nextStatus: store.status === 'active' ? 'suspended' : 'active' })
                  }
                >
                  {store.status === 'active' ? 'Suspend' : 'Reactivate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollPanel>

      <Modal
        isOpen={Boolean(statusChange)}
        onClose={() => setStatusChange(null)}
        title={statusChange?.nextStatus === 'suspended' ? 'Suspend this store?' : 'Reactivate this store?'}
      >
        <div className="flex flex-col gap-4">
          <p className="text-body text-text-secondary">
            {statusChange?.nextStatus === 'suspended'
              ? `${statusChange?.store.name} will stop earning and redeeming immediately. Pending reward codes are cancelled and their points refunded to customers. You can reactivate it later.`
              : `${statusChange?.store.name} will be able to earn and redeem again straight away.`}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStatusChange(null)}>
              Cancel
            </Button>
            <Button
              variant={statusChange?.nextStatus === 'suspended' ? 'danger' : 'primary'}
              className="flex-1"
              isLoading={isChangingStatus}
              onClick={handleConfirmStatusChange}
            >
              {statusChange?.nextStatus === 'suspended' ? 'Suspend store' : 'Reactivate store'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(reconcilingStore)} onClose={() => setReconcilingStore(null)} title="Reconcile balances">
        {discrepancies === null ? (
          <LoadingSpinner className="py-8" />
        ) : discrepancies.length === 0 ? (
          <p className="text-body text-text-secondary">No discrepancies found - balances match the ledger.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-body-sm text-text-secondary">
              {discrepancies.length} membership balance(s) don&apos;t match the ledger.
            </p>
            <div className="flex flex-col gap-2">
              {discrepancies.map((item) => (
                <div key={item._id} className="flex justify-between text-body-sm tabular-nums">
                  <span className="text-text-secondary">Customer •••{item.customerId.slice(-4)}</span>
                  <span className="text-text-primary">
                    {item.actualBalance} → {item.expectedBalance}
                  </span>
                </div>
              ))}
            </div>
            <Button isLoading={isReconciling} onClick={handleConfirmReconcile}>
              Apply corrections
            </Button>
          </div>
        )}
      </Modal>
    </ListPage>
  );
};

export default AdminStores;
