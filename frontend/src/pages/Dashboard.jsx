import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import MetricSummaryCard from '../components/MetricSummaryCard';
import StationCard from '../components/StationCard';
import AlertCard from '../components/AlertCard';
import { LoadingState, ErrorState } from '../components/States';
import api from '../services/api';
import {
  useConnectionStatus,
  useSocketRoom,
  useFallbackPolling,
} from '../hooks/useRealtimeData';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aquiferFilter, setAquiferFilter] = useState('All');
  // Track which station IDs just got a new reading (for highlight flash)
  const [flashIds, setFlashIds] = useState(new Set());
  const navigate = useNavigate();
  const socketStatus = useConnectionStatus();

  // ── REST fetch ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [sumRes, stRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/stations'),
      ]);
      setSummary(sumRes.data.data);
      setStations(stRes.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Fallback polling when socket is down ────────────────────────────────────
  useFallbackPolling(fetchData, socketStatus, 30000);

  // ── Flash helper ────────────────────────────────────────────────────────────
  const flashTimer = useRef({});
  function flashStation(stationId) {
    setFlashIds(prev => new Set([...prev, stationId]));
    clearTimeout(flashTimer.current[stationId]);
    flashTimer.current[stationId] = setTimeout(() => {
      setFlashIds(prev => { const n = new Set(prev); n.delete(stationId); return n; });
    }, 1500);
  }

  // ── Socket room: dashboard ──────────────────────────────────────────────────
  useSocketRoom('dashboard', {
    'reading:new': (data) => {
      // Update the matching station's current_level in the list
      setStations(prev => prev.map(s =>
        s.station_id === data.station_id
          ? { ...s, current_level: data.water_level_m, last_sync: data.recorded_at }
          : s
      ));
      flashStation(data.station_id);
    },

    'trend:updated': (data) => {
      // Update station status + decline rate live
      setStations(prev => prev.map(s =>
        s.station_id === data.station_id
          ? { ...s, status: data.status, decline_rate: data.decline_rate, avg_level: data.avg_level }
          : s
      ));
      // Refresh summary counts (critical/warning counts may have changed)
      api.get('/dashboard/summary').then(r => setSummary(r.data.data)).catch(() => {});
    },

    'alert:new': (alert) => {
      setSummary(prev => {
        if (!prev) return prev;
        const alreadyIn = prev.recent_alerts?.some(a => a.alert_id === alert.alert_id);
        if (alreadyIn) return prev;
        return {
          ...prev,
          active_alerts_count: (prev.active_alerts_count || 0) + 1,
          recent_alerts: [alert, ...(prev.recent_alerts || [])].slice(0, 5),
        };
      });
    },

    'alert:resolved': (alert) => {
      setSummary(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          active_alerts_count: Math.max(0, (prev.active_alerts_count || 1) - 1),
          recent_alerts: (prev.recent_alerts || []).filter(a => a.alert_id !== alert.alert_id),
        };
      });
    },
  });

  // ── Derived state ───────────────────────────────────────────────────────────
  const aquiferTypes = ['All', ...new Set(stations.map(s => s.aquifer_type).filter(Boolean))];
  const filteredStations = aquiferFilter === 'All'
    ? stations
    : stations.filter(s => s.aquifer_type === aquiferFilter);

  if (loading) return <AppLayout title="Resource Management Console" socketStatus={socketStatus}><LoadingState /></AppLayout>;
  if (error) return <AppLayout title="Resource Management Console" socketStatus={socketStatus}><ErrorState message={error} onRetry={fetchData} /></AppLayout>;

  const declineDisplay = summary?.avg_decline_rate != null
    ? (summary.avg_decline_rate >= 0 ? `+${summary.avg_decline_rate.toFixed(3)}` : summary.avg_decline_rate.toFixed(3))
    : '0.000';

  return (
    <AppLayout
      title="Resource Management Console"
      alertCount={summary?.active_alerts_count || 0}
      socketStatus={socketStatus}
    >
      <div className="grid grid-cols-12 gap-6">

        {/* LEFT: Main analytics */}
        <div className="col-span-12 lg:col-span-9 space-y-6">

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricSummaryCard label="Total Stations" value={summary?.total_stations ?? 0} icon="sensors" />
            <MetricSummaryCard label="Critical State" value={summary?.critical_count ?? 0} icon="error" valueClass="text-status-critical" />
            <MetricSummaryCard label="Avg. Decline" value={declineDisplay} unit="m/mo" icon="trending_down" valueClass="text-status-warning" />
            <MetricSummaryCard label="Active Alerts" value={summary?.active_alerts_count ?? 0} icon="notification_important" />
          </div>

          {/* Aquifer filter */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-lg p-4">
            <p className="text-label-caps text-on-surface-variant mb-3">AQUIFER TYPE FILTER</p>
            <div className="flex flex-wrap gap-2">
              {aquiferTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setAquiferFilter(type)}
                  className={`px-3 py-1.5 text-body-sm rounded border transition-colors ${
                    aquiferFilter === type
                      ? 'border-primary text-primary bg-primary/5 font-medium'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Station health table */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-surface-container-low">
              <h3 className="text-body-lg font-bold text-primary">Station Health Summary</h3>
              <button onClick={() => navigate('/stations')} className="text-primary text-body-sm font-medium hover:underline">
                View All Stations
              </button>
            </div>
            <table className="w-full text-left zebra-table">
              <thead className="bg-surface-container text-label-caps text-on-surface-variant">
                <tr>
                  <th className="px-6 py-3 align-middle">Station ID</th>
                  <th className="px-6 py-3 align-middle">Location</th>
                  <th className="px-6 py-3 align-middle">Depth (m)</th>
                  <th className="px-6 py-3 align-middle">Trend (m/mo)</th>
                  <th className="px-6 py-3 align-middle">Status</th>
                  <th className="px-6 py-3 align-middle">Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {filteredStations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant text-body-sm">
                      No stations match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredStations.map(s => (
                    <tr
                      key={s.station_id}
                      className={`transition-all duration-700 ${flashIds.has(s.station_id) ? 'bg-primary/5' : ''}`}
                    >
                      <StationCard station={s} asRow />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Alerts feed */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-lg flex flex-col" style={{ minHeight: '400px' }}>
            <div className="p-4 border-b border-border-subtle bg-primary/5">
              <h3 className="text-body-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">notifications_active</span>
                Recent Alerts
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {summary?.recent_alerts?.length > 0 ? (
                summary.recent_alerts.map(alert => (
                  <AlertCard key={alert.alert_id} alert={alert} />
                ))
              ) : (
                <p className="text-body-sm text-on-surface-variant text-center py-8">No active alerts.</p>
              )}
            </div>
            <div className="p-4 border-t border-border-subtle">
              <button
                onClick={() => navigate('/alerts')}
                className="w-full py-2 text-body-sm font-medium text-primary bg-primary-fixed hover:bg-secondary-fixed transition-colors rounded"
              >
                Manage All Alerts
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
