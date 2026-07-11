import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gw_token');
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

    if (shouldLogout && window.location.pathname !== '/login') {
      localStorage.removeItem('gw_token');
      localStorage.removeItem('gw_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
