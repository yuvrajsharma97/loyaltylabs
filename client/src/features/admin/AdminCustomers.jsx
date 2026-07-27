import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listCustomers } from '../../api/admin';
import Card from '../../shared/components/Card';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { formatDate } from '../../shared/utils/formatters';

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      listCustomers({ search: search.trim() || undefined })
        .then(setCustomers)
        .catch((err) => toast.error(err.message || 'Could not load customers'));
    }, 300); // debounce so every keystroke doesn't fire a request

    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="flex flex-col gap-xl max-w-[1100px] mx-auto">
      <h1 className="font-display text-display-md-mobile md:text-display-md">Customers</h1>

      <div className="flex items-center gap-xs bg-surface-container-low px-lg py-sm rounded-full border border-outline-variant w-full max-w-[420px]">
        <span className="material-symbols-outlined text-outline">search</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 bg-transparent border-none outline-none font-body text-body-md placeholder:text-outline"
        />
      </div>

      {!customers ? (
        <LoadingSpinner />
      ) : customers.length === 0 ? (
        <Card className="text-body-sm text-on-surface-variant">No customers found.</Card>
      ) : (
        <div className="flex flex-col gap-md">
          {customers.map((customer) => (
            <Card
              key={customer._id}
              hoverable
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-lg cursor-pointer"
              onClick={() => navigate(`/admin/customers/${customer._id}`)}
            >
              <div className="flex flex-col gap-xs flex-1 min-w-0">
                <div className="flex items-center gap-sm">
                  <p className="font-body text-body-md font-semibold">{customer.name}</p>
                  {!customer.emailVerified && (
                    <span className="font-mono text-label-mono uppercase px-xs py-[2px] rounded bg-error-container text-on-error-container">
                      Unverified
                    </span>
                  )}
                </div>
                <p className="text-body-sm text-on-surface-variant">{customer.email}</p>
              </div>
              <div className="flex items-center gap-xl shrink-0 text-body-sm text-on-surface-variant">
                <span>{customer.membershipCount} store{customer.membershipCount === 1 ? '' : 's'}</span>
                <span>Joined {formatDate(customer.createdAt)}</span>
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
