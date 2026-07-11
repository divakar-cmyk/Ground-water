import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import { LoadingState, ErrorState } from '../components/States';
import api from '../services/api';
import useAuthStore from '../context/authStore';
import { useConnectionStatus, useSocketRoom, useFallbackPolling } from '../hooks/useRealtimeData';

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString();
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('unresolved');
  const [resolving, setResolving] = useState(null);
  const { isResearcherOrAdmin } = useAuthStore();
  const navigate = useNavigate();
  const socketStatus = useConnectionStatus();

  async function loadAlerts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      const res = await api.get(`/alerts?${params.toString()}`);
      setAlerts(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAlerts(); }, [severityFilter, statusFilter]);

  // Live updates — prepend new alerts, mark resolved ones
  useSocketRoom('dashboard', {
    'alert:new': (alert) => {
      setAlerts(prev => {
        if (prev.some(a => a.alert_id === alert.alert_id)) return prev;
        // Only add if it matches current filters
        if (severityFilter !== 'all' && alert.severity !== severityFilter) return prev;
        if (statusFilter === 'resolved') return prev; // new alerts are unresolved
        return [{ ...alert, resolved: false }, ...prev];
      });
    },
    'alert:resolved': (alert) => {
      if (statusFilter === 'unresolved') {
        // Remove from list since it no longer matches filter
        setAlerts(prev => prev.filter(a => a.alert_id !== alert.alert_id));
      } else {
        setAlerts(prev => prev.map(a =>
          a.alert_id === alert.alert_id ? { ...a, resolved: true, resolved_at: alert.resolved_at } : a
        ));
      }
    },
  });

  useFallbackPolling(loadAlerts, socketStatus, 30000);

  async function handleResolve(alertId) {
    if (!window.confirm('Mark this alert as resolved?')) return;
    setResolving(alertId);
    try {
      await api.put(`/alerts/${alertId}/resolve`);
      await loadAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve alert.');
    } finally {
      setResolving(null);
    }
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <AppLayout title="Alerts & Notifications" socketStatus={socketStatus}>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-headline-lg font-bold text-on-surface">Active System Alerts</h2>
            <p className="text-body-md text-on-surface-variant">
              Real-time monitoring of aquifer depletion thresholds and decline rates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Severity distribution */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-border-subtle p-4 rounded-xl">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3 mb-4">
              <span className="text-label-caps text-on-surface-variant">SEVERITY DISTRIBUTION</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-error-container/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-status-critical" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  <span className="text-body-md font-medium">Critical Issues</span>
                </div>
                <span className="text-display font-bold text-status-critical">{String(criticalCount).padStart(2, '0')}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-status-warning/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-status-warning" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <span className="text-body-md font-medium">Warnings</span>
                </div>
                <span className="text-display font-bold text-status-warning">{String(warningCount).padStart(2, '0')}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary-container/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                  <span className="text-body-md font-medium">Total Loaded</span>
                </div>
                <span className="text-display font-bold text-primary">{String(alerts.length).padStart(2, '0')}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-border-subtle p-4 rounded-xl">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3 mb-4">
              <span className="text-label-caps text-on-surface-variant">FILTERING & SEGMENTATION</span>
              <button
                onClick={() => { setSeverityFilter('all'); setStatusFilter('unresolved'); }}
                className="text-primary text-label-caps underline"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label-caps text-on-surface-variant">SEVERITY LEVEL</label>
                <select
                  value={severityFilter}
                  onChange={e => setSeverityFilter(e.target.value)}
                  className="w-full h-9 bg-surface-muted border border-outline-variant rounded text-body-sm px-2 focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical Only</option>
                  <option value="warning">Warning Only</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label-caps text-on-surface-variant">STATUS</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full h-9 bg-surface-muted border border-outline-variant rounded text-body-sm px-2 focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="all">All</option>
                  <option value="unresolved">Unresolved</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts table */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadAlerts} />
        ) : (
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse zebra-table">
                <thead className="bg-surface-muted border-b border-border-subtle">
                  <tr>
                    {['Severity', 'Alert Type', 'Station', 'Triggered At', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-label-caps text-on-surface-variant align-middle">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant text-body-sm align-middle">
                        No alerts match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    alerts.map(alert => (
                      <tr key={alert.alert_id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-3 align-middle">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-label-caps font-bold ${
                            alert.severity === 'critical'
                              ? 'bg-error-container/30 text-status-critical border-status-critical/20'
                              : 'bg-status-warning/10 text-status-warning border-status-warning/20'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {alert.severity === 'critical' ? 'error' : 'warning'}
                            </span>
                            {alert.severity?.toUpperCase()}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col">
                            <span className="text-body-md font-medium text-primary">{alert.alert_type}</span>
                            <span className="text-body-sm text-on-surface-variant line-clamp-1">{alert.message}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <button
                            onClick={() => navigate(`/stations/${alert.station_id}`)}
                            className="text-body-md font-medium text-secondary hover:underline"
                          >
                            {alert.station_name}
                          </button>
                          <p className="text-body-sm text-on-surface-variant">{alert.location}</p>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-body-sm align-middle">{formatDate(alert.triggered_at)}</td>
                        <td className="px-4 py-3 align-middle">
                          <span className={`flex items-center gap-1.5 text-label-caps font-bold ${alert.resolved ? 'text-status-optimal' : 'text-status-critical'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${alert.resolved ? 'bg-status-optimal' : 'bg-status-critical animate-pulse'}`} />
                            {alert.resolved ? 'Resolved' : 'Unresolved'}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {!alert.resolved && isResearcherOrAdmin() && (
                            <button
                              onClick={() => handleResolve(alert.alert_id)}
                              disabled={resolving === alert.alert_id}
                              className="px-3 py-1 bg-primary text-on-primary text-label-caps rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                              {resolving === alert.alert_id ? 'Resolving...' : 'Resolve'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-surface-muted border-t border-border-subtle">
              <span className="text-body-sm text-on-surface-variant">Showing {alerts.length} alerts</span>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
