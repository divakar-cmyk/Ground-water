import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const ROLES = [
  { value: 'viewer', label: 'Viewer', icon: 'visibility', desc: 'Read-only access to dashboard and alerts' },
  { value: 'researcher', label: 'Researcher', icon: 'analytics', desc: 'Read all data, resolve alerts, export reports' },
  { value: 'admin', label: 'Admin', icon: 'admin_panel_settings', desc: 'Full configuration & system access' },
];

export default function Register() {
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStationsCount, setActiveStationsCount] = useState('—');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadActiveStationsCount() {
      try {
        const { data } = await api.get('/stations/active-count');
        if (isMounted) {
          setActiveStationsCount(data?.count ?? 0);
        }
      } catch (err) {
        console.error('Failed to load active stations count', err);
        if (isMounted) {
          setActiveStationsCount('—');
        }
      }
    }

    loadActiveStationsCount();
    const intervalId = window.setInterval(loadActiveStationsCount, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', {
        name,
        email,
        password,
        role: selectedRole,
      });

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Left panel */}
      <section className="hidden lg:flex lg:w-3/5 relative bg-primary overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-[#0a3d6b] opacity-90" />
        <div className="relative z-10 p-20 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-white text-[48px]">water_drop</span>
            <div>
              <h1 className="text-white font-bold text-headline-lg">Groundwater Resource</h1>
              <p className="text-on-primary-container text-label-caps uppercase tracking-widest opacity-80">
                Management System
              </p>
            </div>
          </div>
          <h2 className="text-white text-display font-bold mb-6 leading-tight">
            Join the National Hydrological Infrastructure Network.
          </h2>
          <p className="text-on-primary-container text-body-lg leading-relaxed mb-12 opacity-90">
            Create an account to access regional water monitoring levels, historical trends,
            automated alert management, and data reporting services.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: activeStationsCount, label: 'Active Stations' },
              { value: '99.9%', label: 'System Uptime' },
              { value: 'Real-Time', label: 'Data Latency' },
            ].map(stat => (
              <div key={stat.label} className="bg-primary-container/40 backdrop-blur p-4 rounded border border-white/10">
                <span className="text-white font-bold text-tabular-nums block">{stat.value}</span>
                <span className="text-on-primary-container text-label-caps opacity-70">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-12 right-12 flex justify-between text-on-primary-container/40 text-label-caps">
          <span>DEPARTMENT OF ENVIRONMENTAL INFRASTRUCTURE</span>
          <span>V 1.0.0</span>
        </div>
      </section>

      {/* Right register panel */}
      <main className="w-full lg:w-2/5 flex flex-col items-center justify-center p-8 bg-surface overflow-y-auto">
        <div className="w-full max-w-md my-8">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <span className="material-symbols-outlined text-primary text-[32px]">water_drop</span>
            <span className="text-primary font-bold text-headline-md">Resource Management Console</span>
          </div>

          <div className="mb-8">
            <h3 className="text-on-surface font-bold text-headline-lg mb-1">Create Account</h3>
            <p className="text-on-surface-variant text-body-md">
              Register for the Groundwater Resource Evaluation System.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div className="space-y-1">
              <label className="block text-label-caps text-on-surface-variant">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Dr. John Doe"
                className="w-full h-12 px-4 border border-outline-variant rounded bg-transparent text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="block text-label-caps text-on-surface-variant">
                Government ID / Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="e.g. researcher@gov.env"
                className="w-full h-12 px-4 border border-outline-variant rounded bg-transparent text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-label-caps text-on-surface-variant">
                Security Passphrase
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                className="w-full h-12 px-4 border border-outline-variant rounded bg-transparent text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant block">REQUEST SYSTEM ROLE</label>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map(role => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`flex flex-col items-center justify-center p-3 border rounded transition-all ${
                      selectedRole === role.value
                        ? 'border-secondary bg-secondary-fixed text-on-secondary-fixed'
                        : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined mb-1">{role.icon}</span>
                    <span className="text-label-caps">{role.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-on-surface-variant italic leading-normal mt-1 bg-surface-container-low p-2 rounded border border-border-subtle">
                {ROLES.find(r => r.value === selectedRole)?.desc}. 
                {selectedRole !== 'viewer' && (
                  <span className="text-status-warning font-semibold block mt-0.5">
                    * Defaults to 'Viewer' role until authorized by an Administrator.
                  </span>
                )}
              </p>
            </div>

            {error && (
              <p className="text-status-critical text-body-sm bg-error-container/30 px-3 py-2 rounded border border-status-critical/20">
                {error}
              </p>
            )}

            {success && (
              <p className="text-status-optimal text-body-sm bg-emerald-50 px-3 py-2 rounded border border-status-optimal/20">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-on-primary font-bold text-body-md rounded hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  Creating Account...
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                </>
              )}
            </button>
          </form>

          {/* Link back to Login */}
          <div className="mt-6 text-center">
            <p className="text-body-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary hover:underline font-bold">
                Secure Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
