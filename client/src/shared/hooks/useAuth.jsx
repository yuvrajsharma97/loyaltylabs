import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAccessToken, getRefreshToken, getStoredRole, setSession, clearSession } from '../../api/client';
import * as authApi from '../../api/auth';
import * as customerApi from '../../api/customer';
import * as storesApi from '../../api/stores';

const AuthContext = createContext(null);

// Login/refresh never return a profile, only { accessToken, refreshToken,
// role } - the profile has to be fetched separately per role. There's no
// "me" endpoint for super_admin, so its profile is just the role itself.
async function fetchProfile(role) {
  if (role === 'customer') return customerApi.getMe();
  if (role === 'store_owner') return storesApi.getMyStore();
  return { role: 'super_admin' };
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState(getStoredRole());
  const [user, setUser] = useState(null);
  // Only worth showing a loading state if there's actually a session to
  // rehydrate - an anonymous visitor has nothing to wait for.
  const [isLoading, setIsLoading] = useState(() => Boolean(getAccessToken() && getStoredRole()));

  const loadProfile = useCallback(async (currentRole) => {
    const profile = await fetchProfile(currentRole);
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    if (!getAccessToken() || !role) return;

    loadProfile(role)
      .catch(() => {
        clearSession();
        setRole(null);
      })
      .finally(() => setIsLoading(false));
    // Only ever needs to run once on mount to rehydrate the session -
    // login()/logout() manage role changes explicitly afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async ({ accessToken, refreshToken, role: newRole }) => {
    setSession({ accessToken, refreshToken, role: newRole });
    setRole(newRole);
    return loadProfile(newRole);
  };

  const logout = async () => {
    try {
      await authApi.logout({ refreshToken: getRefreshToken() });
    } catch {
      // Session is being cleared locally regardless of whether the server
      // call succeeds - a dead/expired refresh token shouldn't block logout.
    }
    clearSession();
    setRole(null);
    setUser(null);
  };

  const value = {
    role,
    user,
    isLoading,
    isAuthenticated: Boolean(role),
    login,
    logout,
    refreshProfile: () => loadProfile(role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
