import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, role: currentRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }
  if (role && currentRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
