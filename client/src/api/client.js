import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const TOKEN_KEY = 'loyaltylabs.accessToken';
const REFRESH_KEY = 'loyaltylabs.refreshToken';
const ROLE_KEY = 'loyaltylabs.role';

// Session state lives in localStorage - only tokens/role, never secrets
// beyond what the backend already hands the client (matches plan section B0:
// "localStorage used for refresh token + session state only").
export function getSession() {
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
    role: localStorage.getItem(ROLE_KEY)
  };
}

export function setSession({ accessToken, refreshToken, role }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (role) localStorage.setItem(ROLE_KEY, role);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(ROLE_KEY);
}

const client = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use((config) => {
  const { accessToken } = getSession();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Single in-flight refresh shared across concurrent 401s, so a burst of
// requests during an expired-token window doesn't fire N parallel refreshes.
let refreshPromise = null;

async function refreshAccessToken() {
  const { refreshToken } = getSession();
  if (!refreshToken) throw new Error('No refresh token available');

  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  setSession({ accessToken: data.data.accessToken });
  return data.data.accessToken;
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const code = response?.data?.code;

    if (response?.status === 401 && code === 'TOKEN_EXPIRED' && !config._retried) {
      config._retried = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const accessToken = await refreshPromise;
        refreshPromise = null;
        config.headers.Authorization = `Bearer ${accessToken}`;
        return client(config);
      } catch (refreshError) {
        refreshPromise = null;
        clearSession();
        window.location.href = '/sign-in';
        return Promise.reject(refreshError);
      }
    }

    // Normalize into the backend's own envelope shape so callers can just
    // read err.code / err.message / err.details without unwrapping axios.
    return Promise.reject({
      code: code || 'NETWORK_ERROR',
      message: response?.data?.message || error.message || 'Something went wrong',
      details: response?.data?.details || {},
      status: response?.status
    });
  }
);

export default client;
