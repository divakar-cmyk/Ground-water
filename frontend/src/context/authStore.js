import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('gw_token') || null,
  user: (() => {
    try { return JSON.parse(localStorage.getItem('gw_user')); } catch { return null; }
  })(),

  login(token, user) {
    localStorage.setItem('gw_token', token);
    localStorage.setItem('gw_user', JSON.stringify(user));
    set({ token, user });
  },

  logout() {
    localStorage.removeItem('gw_token');
    localStorage.removeItem('gw_user');
    set({ token: null, user: null });
  },

  isAuthenticated: () => !!get().token,
  isAdmin: () => get().user?.role === 'admin',
  isResearcherOrAdmin: () => ['admin', 'researcher'].includes(get().user?.role),
}));

export default useAuthStore;
