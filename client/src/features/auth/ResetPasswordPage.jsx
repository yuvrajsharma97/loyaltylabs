import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { showSuccessToast } from '../../shared/utils/toast';
import AuthCard from './AuthCard';
import PasswordInput from '../../shared/components/PasswordInput';
import Button from '../../shared/components/Button';

// Where the "reset your password" email link lands.
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const accountType = searchParams.get('accountType') || 'customer';

  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authApi.resetPassword({ token, newPassword, accountType });
      showSuccessToast('Password updated - sign in with your new password.');
      navigate('/sign-in');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthCard title="Invalid link">
        <p className="text-body text-text-secondary">This password reset link is missing its token.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordInput
          label="New password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        {error && <p className="text-body-sm text-error-text">{error}</p>}
        <Button type="submit" isLoading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthCard>
  );
};

export default ResetPasswordPage;
