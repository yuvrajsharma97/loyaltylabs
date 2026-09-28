import { useCallback, useState } from 'react';
import * as storesApi from '../../api/stores';
import * as disputesApi from '../../api/disputes';
import { useAuth } from '../../shared/hooks/useAuth';
import { usePaginatedList } from '../../shared/hooks/usePaginatedList';
import Pagination from '../../shared/components/Pagination';
import TextArea from '../../shared/components/TextArea';
import { LIMITS, validateText } from '../../shared/utils/validation';
import ListPage from '../../shared/components/ListPage';
import ScrollPanel from '../../shared/components/ScrollPanel';
import { showSuccessToast } from '../../shared/utils/toast';
import SegmentedControl from '../../shared/components/SegmentedControl';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { formatDateTime } from '../../shared/utils/formatters';
import { DISPUTE_TYPE_LABELS } from '../../shared/utils/labels';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
];

const PAGE_SIZE = 10;

const DisputesPanel = () => {
  const { user: store } = useAuth();
  const [status, setStatus] = useState('open');
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPage = useCallback(
    (page) =>
      storesApi
        .listStoreDisputes(store._id, { status: status || undefined, page, limit: PAGE_SIZE })
        .then(({ disputes, pagination }) => ({ items: disputes, pagination })),
    [store._id, status]
  );
  const { items: disputes, pagination, setPage, isLoading, reload } = usePaginatedList(fetchPage);

  const handleResolve = async (event) => {
    event.preventDefault();
    const problem = validateText(note, { label: 'Note', max: LIMITS.note });
    setNoteError(problem);
    if (problem) return;

    setIsSaving(true);
    try {
      await disputesApi.resolveDispute(resolvingDispute._id, { ownerNote: note.trim() || undefined });
      setResolvingDispute(null);
      setNote('');
      reload();
      showSuccessToast('Dispute resolved.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ListPage
      header={
        <>
          <h1 className="text-page-title text-text-primary">Disputes</h1>
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
            {disputes.length === 0 && <EmptyState icon="flag" title="Nothing here" />}

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
                  <p className="mt-1 text-body-sm text-text-secondary">Your note: {dispute.ownerNote}</p>
                )}
                {dispute.status === 'open' && (
                  <Button size="sm" variant="secondary" className="mt-3" onClick={() => setResolvingDispute(dispute)}>
                    Resolve
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </ScrollPanel>
      )}

      <Modal isOpen={Boolean(resolvingDispute)} onClose={() => setResolvingDispute(null)} title="Resolve dispute">
        <form onSubmit={handleResolve} className="flex flex-col gap-3" noValidate>
          <TextArea
            label="What did you do about it? (optional)"
            placeholder="e.g. Checked the till log and added the missing points."
            maxLength={LIMITS.note}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setNoteError(null);
            }}
            error={noteError}
          />
          <Button type="submit" isLoading={isSaving}>
            Mark resolved
          </Button>
        </form>
      </Modal>
    </ListPage>
  );
};

export default DisputesPanel;
