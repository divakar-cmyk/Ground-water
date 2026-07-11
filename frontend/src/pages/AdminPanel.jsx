import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import { LoadingState, ErrorState } from '../components/States';
import api from '../services/api';
import useAuthStore from '../context/authStore';

const TABS = [
  { id: 'stations', label: 'STATION MANAGEMENT' },
  { id: 'users', label: 'USER ROLES' },
];

const EMPTY_STATION = {
  station_name: '', location: '', latitude: '', longitude: '',
  aquifer_type: '', critical_threshold_m: '', safe_decline_limit: '',
  installed_date: '', is_active: true,
};

export default function AdminPanel() {
  const [tab, setTab] = useState('stations');
  const [stations, setStations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editStation, setEditStation] = useState(null);
  const [form, setForm] = useState(EMPTY_STATION);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const { isAdmin } = useAuthStore();

  useEffect(() => {
    if (!isAdmin()) return;
    async function load() {
      try {
        const [stRes] = await Promise.all([api.get('/stations')]);
        setStations(stRes.data.data);
        // Users endpoint not exposed publicly — show placeholder
        setUsers([]);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function openCreate() {
    setEditStation(null);
    setForm(EMPTY_STATION);
    setFormError('');
    setShowForm(true);
  }

  function openEdit(station) {
    setEditStation(station);
    setForm({
      station_name: station.station_name || '',
      location: station.location || '',
      latitude: station.latitude || '',
      longitude: station.longitude || '',
      aquifer_type: station.aquifer_type || '',
      critical_threshold_m: station.critical_threshold_m || '',
      safe_decline_limit: station.safe_decline_limit || '',
      installed_date: station.installed_date || '',
      is_active: station.is_active !== false,
    });
    setFormError('');
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editStation) {
        await api.put(`/stations/${editStation.station_id}`, form);
      } else {
        await api.post('/stations', form);
      }
      const res = await api.get('/stations');
      setStations(res.data.data);
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin()) {
    return (
      <AppLayout title="Admin Panel">
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
          <span className="material-symbols-outlined text-[48px] text-status-critical opacity-60">lock</span>
          <p className="text-body-lg font-medium">Admin access required.</p>
        </div>
      </AppLayout>
    );
  }

  if (loading) return <AppLayout title="Admin Panel"><LoadingState /></AppLayout>;
  if (error) return <AppLayout title="Admin Panel"><ErrorState message={error} onRetry={() => window.location.reload()} /></AppLayout>;

  return (
    <AppLayout title="System Administration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-display font-bold text-primary">System Administration</h2>
            <p className="text-body-md text-on-surface-variant">
              Configure infrastructure, manage stations, and control access protocols.
            </p>
          </div>
          {tab === 'stations' && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded text-label-caps hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">add</span> NEW STATION
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-border-subtle">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 px-1 text-label-caps transition-all border-b-2 ${
                tab === t.id
                  ? 'text-primary border-primary'
                  : 'text-on-surface-variant border-transparent hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Station Management Tab */}
        {tab === 'stations' && (
          <div className="bg-surface-container-lowest rounded-xl border border-border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse zebra-table">
                <thead className="bg-surface-container-low">
                  <tr>
                    {['Station ID', 'Location', 'Aquifer Type', 'Critical Threshold', 'Safe Decline', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-label-caps text-on-surface-variant align-middle">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-body-sm">
                  {stations.map(s => (
                    <tr key={s.station_id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 font-bold text-primary tabular-nums align-middle">{s.station_name}</td>
                      <td className="px-6 py-4 align-middle">{s.location || '—'}</td>
                      <td className="px-6 py-4 align-middle">{s.aquifer_type || '—'}</td>
                      <td className="px-6 py-4 tabular-nums align-middle">{s.critical_threshold_m} m</td>
                      <td className="px-6 py-4 tabular-nums align-middle">{s.safe_decline_limit} m/mo</td>
                      <td className="px-6 py-4 align-middle"><StatusBadge status={s.status || 'normal'} /></td>
                      <td className="px-6 py-4 align-middle">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-secondary text-label-caps hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Roles Tab */}
        {tab === 'users' && (
          <div className="bg-surface-container-lowest rounded-xl border border-border-subtle p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-status-warning">info</span>
              <p className="text-body-md text-on-surface-variant">
                User management is handled via the <code className="bg-surface-container px-1 rounded text-body-sm">POST /api/auth/register</code> endpoint.
                Seed users: <strong>admin@gov.env</strong> (admin), <strong>researcher@gov.env</strong> (researcher), <strong>viewer@gov.env</strong> (viewer).
              </p>
            </div>
            <div className="bg-surface-container rounded p-4 text-body-sm text-on-surface-variant space-y-1">
              <p><strong className="text-on-surface">Admin</strong> — Full access: station CRUD, alert resolution, report export, user management.</p>
              <p><strong className="text-on-surface">Researcher</strong> — Read all data, resolve alerts, export reports.</p>
              <p><strong className="text-on-surface">Viewer</strong> — Read-only access to dashboard, stations, and alerts.</p>
            </div>
          </div>
        )}
      </div>

      {/* Station form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-border-subtle shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center">
              <h3 className="text-body-lg font-bold text-primary">
                {editStation ? `Edit ${editStation.station_name}` : 'New Station'}
              </h3>
              <button onClick={() => setShowForm(false)} className="material-symbols-outlined text-on-surface-variant hover:text-primary">
                close
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {[
                { label: 'Station Name *', key: 'station_name', type: 'text', required: true },
                { label: 'Location', key: 'location', type: 'text' },
                { label: 'Latitude', key: 'latitude', type: 'number', step: '0.000001' },
                { label: 'Longitude', key: 'longitude', type: 'number', step: '0.000001' },
                { label: 'Aquifer Type', key: 'aquifer_type', type: 'text' },
                { label: 'Critical Threshold (m) *', key: 'critical_threshold_m', type: 'number', step: '0.01', required: true },
                { label: 'Safe Decline Limit (m/mo) *', key: 'safe_decline_limit', type: 'number', step: '0.001', required: true },
                { label: 'Installed Date', key: 'installed_date', type: 'date' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-label-caps text-on-surface-variant mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    step={field.step}
                    required={field.required}
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant rounded text-body-sm focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              ))}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="is_active" className="text-body-sm text-on-surface">Station Active</label>
              </div>

              {formError && (
                <p className="text-status-critical text-body-sm bg-error-container/30 px-3 py-2 rounded">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-primary text-on-primary text-label-caps rounded hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editStation ? 'Update Station' : 'Create Station'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-outline-variant text-on-surface text-label-caps rounded hover:bg-surface-container"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
