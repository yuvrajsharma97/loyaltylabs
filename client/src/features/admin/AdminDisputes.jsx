import { useCallback, useState } from 'react';
import * as adminApi from '../../api/admin';
import { usePaginatedList } from '../../shared/hooks/usePaginatedList';
import SegmentedControl from '../../shared/components/SegmentedControl';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import EmptyState from '../../shared/components/EmptyState';
import Pagination from '../../shared/components/Pagination';
import ListPage from '../../shared/components/ListPage';
import ScrollPanel from '../../shared/components/ScrollPanel';
import { formatDateTime } from '../../shared/utils/formatters';
import { DISPUTE_TYPE_LABELS } from '../../shared/utils/labels';

const STATUS_FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
];

const PAGE_SIZE = 10;

// There's no admin-side approval workflow in the backend (stores go live
// immediately on registration) - this tab does the closest real thing an
// admin can act on: platform-wide dispute oversight. Resolving still
// happens on the store owner's side; this is read-only here.
const AdminDisputes = () => {
  const [status, setStatus] = useState('open');

  const fetchPage = useCallback(
    (page) =>
      adminApi
        .listDisputes({ status, page, limit: PAGE_SIZE })
        .then(({ disputes, pagination }) => ({ items: disputes, pagination })),
    [status]
  );
  const { items: disputes, pagination, setPage, isLoading } = usePaginatedList(fetchPage);

  return (
    <ListPage
      header={
        <>
          <h1 className="text-page-title text-text-primary">Disputes</h1>
          <p className="mt-1 text-body-sm text-text-secondary">Disputes that need attention across every store.</p>
          <SegmentedControl options={STATUS_FILTERS} value={status} onChange={setStatus} className="mt-4" />
        </>
      }
      footer={<Pagination pagination={pagination} onPageChange={setPage} isDisabled={isLoading} itemLabel="disputes" />}
    >
      {isLoading && disputes.length === 0 ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <ScrollPanel resetKey={disputes[0]?._id} className="-mx-1 flex-1 px-1 py-1">
          <div className={`flex flex-col gap-3 transition-opacity duration-150 ${isLoading ? 'opacity-50' : ''}`}>
            {disputes.length === 0 && <EmptyState icon="fact_check" title="Nothing here" />}
            {disputes.map((dispute) => (
              <Card key={dispute._id}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={dispute.status === 'open' ? 'warning' : 'success'}>{dispute.status}</Badge>
                    <span className="text-label text-text-secondary">
                      {DISPUTE_TYPE_LABELS[dispute.transactionType] || dispute.transactionType}
                    </span>
                  </div>
                  <span className="font-mono text-label text-text-muted">{formatDateTime(dispute.createdAt)}</span>
                </div>
                <p className="mt-2 text-body text-text-primary">{dispute.customerNote}</p>
                {dispute.ownerNote && (
                  <p className="mt-1 text-body-sm text-text-secondary">Store note: {dispute.ownerNote}</p>
                )}
                {dispute.resolvedAt && (
                  <p className="mt-1 text-label text-text-muted">Resolved {formatDateTime(dispute.resolvedAt)}</p>
                )}
              </Card>
            ))}
          </div>
        </ScrollPanel>
      )}
    </ListPage>
  );
};

export default AdminDisputes;
