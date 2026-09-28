import axios from 'axios';

const ACCESS_TOKEN_KEY = 'loyaltylabs_access_token';
const REFRESH_TOKEN_KEY = 'loyaltylabs_refresh_token';
const ROLE_KEY = 'loyaltylabs_role';

// The backend has no cookie-based auth at all - both tokens travel as plain
// values (header for access, JSON body for refresh) and it's on us to
// persist them. See backend/src/features/auth for the source of truth.
export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function setSession({ accessToken, refreshToken, role }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (role) localStorage.setItem(ROLE_KEY, role);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Only one refresh call should ever be in flight - concurrent 401s from
// several requests must all wait on the same promise instead of each
// racing the backend's non-rotating refresh token.
let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
    refreshToken,
  });

  const { accessToken } = response.data.data;
  setSession({ accessToken });
  return accessToken;
}

function forceLogout() {
  clearSession();
  if (window.location.pathname !== '/sign-in') {
    window.location.href = '/sign-in';
  }
}

apiClient.interceptors.response.use(
  (response) => response.data.data,
  async (error) => {
    const { config, response } = error;
    const code = response?.data?.code;
    const wasAuthenticated = Boolean(config?.headers?.Authorization);

    if (response?.status === 401 && wasAuthenticated && !config._retried) {
      config._retried = true;

      if (code === 'TOKEN_EXPIRED') {
        try {
          refreshPromise = refreshPromise || refreshAccessToken();
          const accessToken = await refreshPromise;
          refreshPromise = null;
          config.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(config);
        } catch {
          refreshPromise = null;
          forceLogout();
        }
      } else {
        forceLogout();
      }
    }

    const normalizedError = new Error(response?.data?.message || 'Something went wrong. Please try again.');
    normalizedError.code = code || 'UNKNOWN_ERROR';
    normalizedError.details = response?.data?.details || {};
    normalizedError.status = response?.status;
    return Promise.reject(normalizedError);
  }
);

export default apiClient;
