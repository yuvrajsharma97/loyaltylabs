import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { showSuccessToast } from '../utils/toast';
import Button from './Button';
import Icon from './Icon';

// Shown to customers who haven't verified their email yet. They can earn
// points meanwhile; redeeming rewards needs a verified email (the server
// refuses with EMAIL_NOT_VERIFIED).
// compact: a one-line nudge linking to the account page, for screens where
// verifying isn't the main task.
const VerifyEmailNotice = ({ email, compact = false, className = '' }) => {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await authApi.resendVerification({ email, accountType: 'customer' });
      setIsSent(true);
      showSuccessToast(`Verification link sent to ${email}.`);
    } finally {
      setIsSending(false);
    }
  };

  if (compact) {
    return (
      <Link
        to="/customer/account"
        className={`flex items-center gap-2 rounded-card border border-warning bg-warning-bg px-3 py-2 text-body-sm text-warning-text ${className}`}
      >
        <Icon name="mark_email_unread" style={{ fontSize: '1.1rem' }} />
        <span className="flex-1">Verify your email to redeem rewards.</span>
        <Icon name="chevron_right" style={{ fontSize: '1.1rem' }} />
      </Link>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-card border border-warning bg-warning-bg p-4 wide:flex-row wide:items-center wide:justify-between ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon name="mark_email_unread" className="text-warning-text" />
        <div>
          <p className="text-card-title text-text-primary">Verify your email</p>
          <p className="text-body-sm text-text-secondary">
            You can keep earning points, but you&apos;ll need to verify <strong>{email}</strong> before you can
            redeem them.
          </p>
        </div>
      </div>
      <Button size="sm" variant="secondary" isLoading={isSending} onClick={handleSend} className="shrink-0">
        {isSent ? 'Send again' : 'Send verification link'}
      </Button>
    </div>
  );
};

export default VerifyEmailNotice;
