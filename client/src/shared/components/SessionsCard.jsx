import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { useAuth } from '../hooks/useAuth';
import Card from './Card';
import Button from './Button';

// Log out of this device, or every device (e.g. a lost phone or till).
const SessionsCard = ({ signInPath = '/sign-in' }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(signInPath);
  };

  const handleLogoutAll = async () => {
    setIsSigningOutAll(true);
    try {
      await authApi.logoutAll();
      await logout();
      navigate(signInPath);
    } finally {
      setIsSigningOutAll(false);
    }
  };

  return (
    <Card>
      <h2 className="text-card-title text-text-primary">Sessions</h2>
      <p className="mt-1 text-body-sm text-text-secondary">
        Lost a device? Sign out everywhere and sign back in here.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={handleLogout}>
          Log out
        </Button>
        <Button variant="danger" isLoading={isSigningOutAll} onClick={handleLogoutAll}>
          Log out of all devices
        </Button>
      </div>
    </Card>
  );
};

export default SessionsCard;
