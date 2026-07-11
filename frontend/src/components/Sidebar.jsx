import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'dashboard', label: 'Overview' },
  { to: '/stations', icon: 'analytics', label: 'Station Details' },
  { to: '/alerts', icon: 'warning', label: 'Alerts' },
  { to: '/reports', icon: 'description', label: 'Reports' },
];

const navClass = ({ isActive }) =>
  `flex items-center gap-3 py-3 pl-5 pr-6 transition-colors duration-150 border-l-4 ${
    isActive
      ? 'bg-secondary-container text-on-secondary-container border-secondary-fixed'
      : 'text-on-primary-container hover:bg-primary-container border-transparent'
  }`;

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="flex flex-col h-screen fixed left-0 top-0 z-50 bg-primary border-r border-white/10" style={{ width: '260px' }}>
      <div className="px-6 py-5 shrink-0">
        <h1 className="text-headline-md font-bold text-on-primary leading-tight">Groundwater Resource</h1>
        <p className="text-label-caps text-on-primary-container opacity-70 uppercase tracking-widest mt-1">
          Management System
        </p>
      </div>

      <nav className="flex-1 mt-2 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} className={navClass}>
            <span className="material-symbols-outlined text-[20px] shrink-0">{icon}</span>
            <span className="text-body-md">{label}</span>
          </NavLink>
        ))}

        {isAdmin() && (
          <NavLink to="/admin" className={navClass}>
            <span className="material-symbols-outlined text-[20px] shrink-0">admin_panel_settings</span>
            <span className="text-body-md">Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 space-y-3 shrink-0">
        <div className="flex items-center gap-3 px-2">
          <span className="material-symbols-outlined text-on-primary-container shrink-0">account_circle</span>
          <div className="min-w-0">
            <p className="text-body-sm text-on-primary truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-on-primary-container opacity-70 uppercase">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2 text-label-caps text-on-primary-container border border-white/20 rounded hover:bg-primary-container transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
