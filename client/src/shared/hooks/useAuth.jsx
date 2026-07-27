import { createContext, useContext, useMemo, useState } from 'react';
import client, { setSession, clearSession, getSession } from '../../api/client';
import { getMe as getCustomerMe } from '../../api/customer';
import { getMyStore, getOnboarding as getStoreOnboarding } from '../../api/storeOwner';

const AuthContext = createContext(null);

// Login only ever returns {accessToken, refreshToken, role} - never
// onboarding status - so both sign-in and "am I still logged in on refresh"
// need this extra lookup to decide dashboard vs onboarding.
export async function resolvePostAuthPath(role) {
  if (role === 'customer') {
    const me = await getCustomerMe();
    return me.onboardingCompleted ? '/customer' : '/onboarding/customer';
  }
  if (role === 'store_owner') {
    const store = await getMyStore();
    const onboarding = await getStoreOnboarding(store._id);
    // loyaltyRuleSet is the only backend-tracked flag that maps to a
    // required onboarding step (till PINs have no dedicated flag -
    // tillModeTested is set by the till on first real scan, not by adding a
    // PIN - so the onboarding flow itself enforces that step client-side).
    return onboarding.loyaltyRuleSet ? '/store' : '/onboarding/store';
  }
  if (role === 'super_admin') return '/admin';
  return '/sign-in';
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => getSession().role);

  const login = async ({ email, password, accountType }) => {
    const { data } = await client.post('/auth/login', { email, password, accountType });
    setSession({ ...data.data, role: data.data.role });
    setRole(data.data.role);
    return data.data;
  };

  const loginWithGoogle = async (idToken) => {
    const { data } = await client.post('/auth/google', { idToken });
    setSession({ ...data.data, role: data.data.role });
    setRole(data.data.role);
    return data.data;
  };

  const registerCustomer = async ({ name, email, password, phone }) => {
    const { data } = await client.post('/auth/register/customer', { name, email, password, phone });
    return data.data;
  };

  // ownerName/storeName/phone are collected during onboarding instead - see
  // auth.handler.js's registerStore for the placeholder-name reasoning.
  const registerStore = async ({ email, password }) => {
    const { data } = await client.post('/auth/register/store', { email, password });
    return data.data;
  };

  const logout = async () => {
    const { refreshToken } = getSession();
    try {
      if (refreshToken) await client.post('/auth/logout', { refreshToken });
    } catch {
      // Already-invalid refresh token shouldn't block clearing local session.
    }
    clearSession();
    setRole(null);
  };

  const value = useMemo(
    () => ({
      role,
      isAuthenticated: Boolean(role),
      login,
      loginWithGoogle,
      registerCustomer,
      registerStore,
      logout
    }),
    [role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
