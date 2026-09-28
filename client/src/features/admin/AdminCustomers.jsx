import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import * as adminApi from '../../api/admin';
import { usePaginatedList } from '../../shared/hooks/usePaginatedList';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import Pagination from '../../shared/components/Pagination';
import ListPage from '../../shared/components/ListPage';
import ScrollPanel from '../../shared/components/ScrollPanel';
import { formatDate } from '../../shared/utils/formatters';
import SearchInput from '../../shared/components/SearchInput';
import Card from '../../shared/components/Card';
import Avatar from '../../shared/components/Avatar';
import Badge from '../../shared/components/Badge';
import Icon from '../../shared/components/Icon';
import EmptyState from '../../shared/components/EmptyState';
import SkeletonRow from '../../shared/components/SkeletonRow';

const PAGE_SIZE = 10;

const AdminCustomers = () => {
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query.trim());

  const fetchPage = useCallback(
    (page) =>
      adminApi
        .listCustomers({ search: search || undefined, page, limit: PAGE_SIZE })
        .then(({ customers: fetched, pagination }) => ({ items: fetched, pagination })),
    [search]
  );
  const { items: customers, pagination, setPage, isLoading } = usePaginatedList(fetchPage);

  return (
    <ListPage
      maxWidthClassName="max-w-3xl"
      header={
        <>
          <h1 className="text-page-title text-text-primary">Customers</h1>
          <p className="mt-1 text-body-sm text-text-secondary">Everyone with a customer account on the platform.</p>
          <div className="mt-4">
            <SearchInput
              placeholder="Search by name or email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </>
      }
      footer={
        <Pagination pagination={pagination} onPageChange={setPage} isDisabled={isLoading} itemLabel="customers" />
      }
    >
      <ScrollPanel resetKey={customers[0]?._id} className="-mx-1 flex-1 px-1 py-1">
        <div className={`flex flex-col gap-2 transition-opacity duration-150 ${isLoading && customers.length > 0 ? 'opacity-50' : ''}`}>
          {isLoading && customers.length === 0 && (
            <Card>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </Card>
          )}

          {!isLoading && customers.length === 0 && (
            <EmptyState icon="person_search" title="No customers found" body="Try a different name or email." />
          )}

          {customers.map((customer) => (
            <Link key={customer._id} to={`/admin/customers/${customer._id}`}>
              <Card isInteractive className="flex items-center gap-3">
                <Avatar name={customer.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-card-title text-text-primary">{customer.name}</p>
                    {!customer.emailVerified && <Badge tone="warning">Unverified</Badge>}
                    {!customer.onboardingCompleted && <Badge tone="neutral">Not onboarded</Badge>}
                  </div>
                  <p className="truncate text-body-sm text-text-secondary">{customer.email}</p>
                </div>
                <div className="hidden shrink-0 text-right wide:block">
                  <p className="tabular-nums text-body-sm text-text-primary">
                    {customer.membershipCount} shop{customer.membershipCount === 1 ? '' : 's'}
                  </p>
                  <p className="text-label text-text-muted">Joined {formatDate(customer.createdAt)}</p>
                </div>
                <Icon name="chevron_right" className="text-text-muted" />
              </Card>
            </Link>
          ))}
        </div>
      </ScrollPanel>
    </ListPage>
  );
};

export default AdminCustomers;
