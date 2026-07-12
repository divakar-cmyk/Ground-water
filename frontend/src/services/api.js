import axios from 'axios';

function safeStorageGet(key) {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageRemove(key) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = safeStorageGet('gw_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Clear stale auth and redirect to login for expired/invalid sessions.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const code = err.response?.data?.code;
    const shouldLogout = status === 401 || (status === 403 && ['INVALID_TOKEN', 'FORBIDDEN'].includes(code));

    if (shouldLogout && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      safeStorageRemove('gw_token');
      safeStorageRemove('gw_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
