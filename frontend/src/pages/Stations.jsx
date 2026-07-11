import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import StationCard from '../components/StationCard';
import StationFormModal from '../components/StationFormModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { LoadingState, ErrorState } from '../components/States';
import { getStations, createStation, updateStation, deleteStation } from '../services/stationService';
import useAuthStore from '../context/authStore';

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const canManageStations = isAdmin();

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = Add, station = Edit
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getStations();
      setStations(data);
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to load stations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAdd() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function handleEdit(station) {
    setEditTarget(station);
    setFormOpen(true);
  }

  function handleView(station) {
    navigate(`/stations/${station.station_id}`);
  }

  function handleDeletePrompt(station) {
    setDeleteTarget(station);
  }

  async function handleSave(values) {
    setSaving(true);
    try {
      if (editTarget) {
        await updateStation(editTarget.station_id, values);
      } else {
        await createStation(values);
      }
      await load();
      setFormOpen(false);
    } catch (err) {
      // Surface error inside modal via re-throw — modal shows nothing extra,
      // but the operation is safely aborted
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStation(deleteTarget.station_id);
      await load();
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const normalizedSearch = (search || '').toString().trim().toLowerCase();

  const filtered = stations.filter(s => {
    if (!normalizedSearch) return true;

    const stationName = (s.station_name || '').toString().toLowerCase();
    const location = (s.location || '').toString().toLowerCase();
    const stationId = (s.station_id || '').toString().toLowerCase();

    return stationName.includes(normalizedSearch)
      || location.includes(normalizedSearch)
      || stationId.includes(normalizedSearch);
  });

  if (loading) return <AppLayout title="Station Details"><LoadingState /></AppLayout>;
  if (error) return <AppLayout title="Station Details"><ErrorState message={error} onRetry={load} /></AppLayout>;

  return (
    <AppLayout title="Station Details">
      <div className="space-y-4">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-headline-lg font-bold text-primary">All Monitoring Stations</h2>
            <p className="text-body-md text-on-surface-variant">{stations.length} stations registered</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">
                search
              </span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or location..."
                className="h-9 pl-8 pr-4 bg-surface-container-low border border-outline-variant/30 rounded text-body-sm focus:ring-2 focus:ring-primary outline-none w-64"
              />
            </div>

            {/* Add Station */}
            {canManageStations && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 h-9 px-4 bg-primary text-on-primary text-label-caps rounded hover:opacity-90 active:scale-95 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Station
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-surface-container-lowest border border-border-subtle rounded-lg overflow-hidden">
          <table className="w-full text-left zebra-table">
            <thead className="bg-surface-container text-label-caps text-on-surface-variant">
              <tr>
                <th className="px-6 py-3 align-middle">Station ID</th>
                <th className="px-6 py-3 align-middle">Location</th>
                <th className="px-6 py-3 align-middle">Depth (m)</th>
                <th className="px-6 py-3 align-middle">Trend (m/mo)</th>
                <th className="px-6 py-3 align-middle">Status</th>
                <th className="px-6 py-3 align-middle">Last Sync</th>
                {canManageStations && <th className="px-6 py-3 align-middle">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canManageStations ? 7 : 6} className="px-6 py-10 text-center text-on-surface-variant text-body-sm">
                    No stations found.
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <StationCard
                    key={s.station_id}
                    station={s}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeletePrompt}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit modal ── */}
      {formOpen && (
        <StationFormModal
          station={editTarget}
          onSave={handleSave}
          onClose={() => !saving && setFormOpen(false)}
          saving={saving}
        />
      )}

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <DeleteConfirmDialog
          stationName={deleteTarget.station_name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </AppLayout>
  );
}
