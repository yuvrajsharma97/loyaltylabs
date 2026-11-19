import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { useAuth } from '../hooks/useAuth';
import { showSuccessToast } from '../utils/toast';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import Input from './Input';
import PasswordInput from './PasswordInput';

const CONFIRM_ERRORS = ['CURRENT_PASSWORD_INCORRECT', 'CURRENT_PASSWORD_REQUIRED', 'DELETE_CONFIRMATION_MISMATCH'];

// Self-serve account deletion. Customers lose their QR code and points; an
// owner's shop closes for good. Personal details are held hidden for six
// months, then wiped (backend: accountDeletion.service.js).
const DeleteAccountCard = ({ isStoreOwner = false, hasPassword = true, email = '' }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const close = () => {
    setIsOpen(false);
    setConfirmation('');
    setError(null);
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    if (!confirmation.trim()) {
      setError(hasPassword ? 'Enter your password.' : 'Type your email address.');
      return;
    }

    setIsDeleting(true);
    try {
      await authApi.deleteAccount(
        hasPassword ? { password: confirmation } : { confirmEmail: confirmation.trim().toLowerCase() }
      );
      await logout();
      showSuccessToast(isStoreOwner ? 'Your account is deleted and your shop is closed.' : 'Your account is deleted.');
      navigate('/', { replace: true });
    } catch (err) {
      if (CONFIRM_ERRORS.includes(err.code)) {
        setError(err.message);
      } else {
        throw err;
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const consequences = isStoreOwner
    ? [
        'Your shop closes straight away and disappears from the directory.',
        'The till stops working. Customers can no longer earn or spend points with you.',
        "Customers' unused reward codes are cancelled and their points given back.",
        'Billing stops. Your shop cannot be reopened.',
      ]
    : [
        'Your FuseCard stops working and you are signed out everywhere.',
        'Your points at every shop are lost, and unused reward codes are cancelled.',
      ];

  return (
    <Card>
      <h2 className="text-card-title text-text-primary">Delete account</h2>
      <p className="mt-1 text-body-sm text-text-secondary">
        {isStoreOwner
          ? 'Permanently delete your account and close your shop.'
          : 'Permanently delete your account and points.'}
      </p>
      <Button variant="danger" className="mt-4" onClick={() => setIsOpen(true)}>
        Delete account
      </Button>

      <Modal isOpen={isOpen} onClose={close} title="Delete your account?">
        <form onSubmit={handleDelete} className="flex flex-col gap-4" noValidate>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body-sm text-text-secondary">
            {consequences.map((line) => (
              <li key={line}>{line}</li>
            ))}
            <li>
              We keep your personal details hidden for up to 6 months in case of a dispute, then delete them for
              good.
            </li>
          </ul>

          {hasPassword ? (
            <PasswordInput
              label="Your password"
              autoComplete="current-password"
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value);
                setError(null);
              }}
              error={error}
            />
          ) : (
            <Input
              label={`Type ${email} to confirm`}
              type="email"
              autoComplete="off"
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value);
                setError(null);
              }}
              error={error}
            />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={close}>
              Keep account
            </Button>
            <Button type="submit" variant="danger" className="flex-1" isLoading={isDeleting}>
              {isStoreOwner ? 'Delete and close shop' : 'Delete account'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};

export default DeleteAccountCard;
