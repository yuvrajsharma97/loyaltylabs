import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { showSuccessToast } from '../../shared/utils/toast';
import AuthCard from './AuthCard';
import PasswordInput from '../../shared/components/PasswordInput';
import Button from '../../shared/components/Button';
import { LIMITS, hasErrors, validatePassword } from '../../shared/utils/validation';

// Where the "reset your password" email link lands.
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const accountType = searchParams.get('accountType') || 'customer';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const errors = {
      newPassword: validatePassword(newPassword, { label: 'New password' }),
      confirmPassword: confirmPassword === newPassword ? null : "Passwords don't match.",
    };
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <PasswordInput
          label="New password"
          value={newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, newPassword: undefined }));
          }}
          autoComplete="new-password"
          maxLength={LIMITS.password}
          error={fieldErrors.newPassword}
        />
        <PasswordInput
          label="Confirm new password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
          }}
          autoComplete="new-password"
          maxLength={LIMITS.password}
          error={fieldErrors.confirmPassword}
        />
        <p className="text-body-sm text-text-muted">At least 8 characters, with a letter and a number.</p>
        {error && <p className="text-body-sm text-error-text">{error}</p>}
        <Button type="submit" isLoading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthCard>
  );
};

export default ResetPasswordPage;
