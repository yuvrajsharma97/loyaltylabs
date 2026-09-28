import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { useAuth } from '../../shared/hooks/useAuth';
import AuthCard from './AuthCard';
import Input from '../../shared/components/Input';
import PasswordInput from '../../shared/components/PasswordInput';
import Button from '../../shared/components/Button';
import { LIMITS, hasErrors, validateEmail } from '../../shared/utils/validation';

// Reachable only by direct URL - never linked from any nav or sign-in page.
const AdminSignInPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const errors = { email: validateEmail(email), password: password ? null : 'Enter your password.' };
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setIsSubmitting(true);
    try {
      const session = await authApi.login({ email: email.trim(), password, accountType: 'user' });
      if (session.role !== 'super_admin') {
        setError('This account does not have admin access.');
        return;
      }
      await login(session);
      navigate('/admin/stats');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard title="Admin sign in">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          maxLength={LIMITS.email}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
          error={fieldErrors.email}
        />
        <PasswordInput
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          autoComplete="current-password"
          maxLength={LIMITS.password}
          error={fieldErrors.password}
        />
        {error && <p className="text-body-sm text-error-text">{error}</p>}
        <Button type="submit" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
};

export default AdminSignInPage;
