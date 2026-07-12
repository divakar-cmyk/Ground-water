import { create } from 'zustand';

function safeStorageGet(key) {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function safeStorageRemove(key) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

const useAuthStore = create((set, get) => ({
  token: safeStorageGet('gw_token') || null,
  user: (() => {
    try {
      const raw = safeStorageGet('gw_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })(),

  login(token, user) {
    safeStorageSet('gw_token', token);
    safeStorageSet('gw_user', JSON.stringify(user));
    set({ token, user });
  },

  logout() {
    safeStorageRemove('gw_token');
    safeStorageRemove('gw_user');
    set({ token: null, user: null });
  },

  isAuthenticated: () => !!get().token,
  isAdmin: () => get().user?.role === 'admin',
  isResearcherOrAdmin: () => ['admin', 'researcher'].includes(get().user?.role),
}));

export default useAuthStore;
