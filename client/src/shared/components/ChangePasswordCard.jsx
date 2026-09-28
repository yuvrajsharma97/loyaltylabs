import { useState } from 'react';
import * as authApi from '../../api/auth';
import { getRefreshToken } from '../../api/client';
import { showSuccessToast } from '../utils/toast';
import Card from './Card';
import Button from './Button';
import PasswordInput from './PasswordInput';
import { LIMITS, validatePassword } from '../utils/validation';

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

// Shared by customer Account and the store owner's Settings > Account.
// hasPassword=false is a Google-only customer setting a password for the
// first time - there's no current password to ask for.
const ChangePasswordCard = ({ hasPassword = true, onPasswordChanged }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (hasPassword && !form.currentPassword) nextErrors.currentPassword = 'Enter your current password.';
    const problem = validatePassword(form.newPassword, { label: 'New password' });
    if (problem) nextErrors.newPassword = problem;
    else if (hasPassword && form.newPassword === form.currentPassword) {
      nextErrors.newPassword = 'Choose a password different from your current one.';
    }
    if (form.confirmPassword !== form.newPassword) nextErrors.confirmPassword = "Passwords don't match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: hasPassword ? form.currentPassword : undefined,
        newPassword: form.newPassword,
        refreshToken: getRefreshToken(),
      });
      setForm(EMPTY_FORM);
      showSuccessToast('Password updated. Other devices have been signed out.');
      onPasswordChanged?.();
    } catch (err) {
      if (err.code === 'CURRENT_PASSWORD_INCORRECT' || err.code === 'CURRENT_PASSWORD_REQUIRED') {
        setErrors({ currentPassword: err.message });
      } else if (err.code === 'PASSWORD_TOO_WEAK') {
        setErrors({ newPassword: 'Use at least 8 characters, with a letter and a number.' });
      } else {
        throw err;
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <h2 className="text-card-title text-text-primary">{hasPassword ? 'Change password' : 'Set a password'}</h2>
      <p className="mt-1 text-body-sm text-text-secondary">
        {hasPassword
          ? "You'll stay signed in here; other devices will be signed out."
          : 'Add a password so you can also sign in with your email.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3" noValidate>
        {hasPassword && (
          <PasswordInput
            label="Current password"
            autoComplete="current-password"
            maxLength={LIMITS.password}
            value={form.currentPassword}
            onChange={updateField('currentPassword')}
            error={errors.currentPassword}
          />
        )}
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          maxLength={LIMITS.password}
          value={form.newPassword}
          onChange={updateField('newPassword')}
          error={errors.newPassword}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          maxLength={LIMITS.password}
          value={form.confirmPassword}
          onChange={updateField('confirmPassword')}
          error={errors.confirmPassword}
        />
        <Button type="submit" isLoading={isSaving} className="self-start">
          {hasPassword ? 'Update password' : 'Set password'}
        </Button>
      </form>
    </Card>
  );
};

export default ChangePasswordCard;
