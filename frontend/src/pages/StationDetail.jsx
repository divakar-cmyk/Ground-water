import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TrendChart from '../components/TrendChart';
import StatusBadge from '../components/StatusBadge';
import { LoadingState, ErrorState } from '../components/States';
import api from '../services/api';
import {
  useConnectionStatus,
  useSocketRoom,
  useFallbackPolling,
} from '../hooks/useRealtimeData';

const RANGE_OPTIONS = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'All', value: 'all' },
];

function formatDate(str) {
  if (!str) return 'N/A';
  return new Date(str).toLocaleString();
}

export default function StationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketStatus = useConnectionStatus();

  const [station, setStation] = useState(null);
  const [readings, setReadings] = useState([]);
  const [trend, setTrend] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [range, setRange] = useState('90d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Highlight flash for gauge on trend update
  const [gaugeFlash, setGaugeFlash] = useState(false);

  // ── REST fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [stRes, trendRes, alertRes] = await Promise.all([
        api.get(`/stations/${id}`),
        api.get(`/stations/${id}/trend`),
        api.get(`/alerts?station_id=${id}`),
      ]);
      setStation(stRes.data.data);
      setTrend(trendRes.data.data);
      setAlerts(alertRes.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load station data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReadings = useCallback(async () => {
    try {
      const res = await api.get(`/stations/${id}/readings?range=${range}`);
      setReadings(res.data.data);
    } catch { /* silent */ }
  }, [id, range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchReadings(); }, [fetchReadings]);

  // ── Fallback polling ────────────────────────────────────────────────────────
  useFallbackPolling(fetchAll, socketStatus, 30000);

  // ── Socket room: station:<id> ───────────────────────────────────────────────
  useSocketRoom(
    `station:${id}`,
    {
      'reading:new': (data) => {
        if (String(data.station_id) !== String(id)) return;
        // Append new point to chart (only if quality is good/interpolated)
        if (data.data_quality !== 'anomalous') {
          setReadings(prev => [
            ...prev,
            {
              reading_id: Date.now(),
              station_id: data.station_id,
              water_level_m: data.water_level_m,
              recorded_at: data.recorded_at,
              data_quality: data.data_quality,
            },
          ]);
        }
        // Update station latest reading
        setStation(prev => prev
          ? { ...prev, latest_reading: { water_level_m: data.water_level_m, recorded_at: data.recorded_at } }
          : prev
        );
      },

      'trend:updated': (data) => {
        if (String(data.station_id) !== String(id)) return;
        setTrend(prev => prev
          ? { ...prev, latest_trend: { ...prev.latest_trend, ...data } }
          : prev
        );
        // Flash the gauge
        setGaugeFlash(true);
        setTimeout(() => setGaugeFlash(false), 1200);
      },

      'alert:new': (alert) => {
        if (String(alert.station_id) !== String(id)) return;
        setAlerts(prev => [{ ...alert, resolved: false }, ...prev]);
      },

      'alert:resolved': (alert) => {
        if (String(alert.station_id) !== String(id)) return;
        setAlerts(prev => prev.map(a =>
          a.alert_id === alert.alert_id ? { ...a, resolved: true, resolved_at: alert.resolved_at } : a
        ));
      },
    },
    [id]
  );

  if (loading) return <AppLayout title="Station Details" socketStatus={socketStatus}><LoadingState /></AppLayout>;
  if (error) return <AppLayout title="Station Details" socketStatus={socketStatus}><ErrorState message={error} onRetry={fetchAll} /></AppLayout>;

  const latestTrend = trend?.latest_trend || {};
  const declineRate = latestTrend.decline_rate ?? 0;
  const status = latestTrend.status || 'normal';
  const safeLimit = station?.safe_decline_limit || 1;
  const gaugePercent = Math.min(100, Math.abs(declineRate) / safeLimit * 100);
  const circumference = 2 * Math.PI * 58;
  const strokeOffset = circumference - (gaugePercent / 100) * circumference;
  const gaugeColor = status === 'critical' ? '#D32F2F' : status === 'warning' ? '#F57C00' : '#388E3C';

  return (
    <AppLayout title="Station Details" socketStatus={socketStatus}>
      {/* Header */}
      <section className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary mb-2">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-display font-bold text-primary">Station {station.station_name}</h2>
            <StatusBadge status={status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-on-surface-variant mt-1">
            {station.latitude && (
              <span className="flex items-center gap-1 text-body-md">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {parseFloat(station.latitude).toFixed(4)}° N, {parseFloat(station.longitude).toFixed(4)}° E
              </span>
            )}
            <span className="flex items-center gap-1 text-body-md">
              <span className="material-symbols-outlined text-[16px]">layers</span>
              {station.aquifer_type || 'Unknown'} Aquifer
            </span>
            <span className="flex items-center gap-1 text-body-md">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              Installed: {station.installed_date || 'N/A'}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/reports?stationIds=${id}`)}
          className="px-4 py-2 bg-primary text-on-primary text-body-md rounded flex items-center gap-2 hover:opacity-90"
        >
          <span className="material-symbols-outlined text-sm">download</span> Export Data
        </button>
      </section>

      <div className="grid grid-cols-12 gap-6">
        {/* Main chart */}
        <div className="col-span-12 lg:col-span-9 bg-surface-container-lowest border border-border-subtle rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-body-lg font-bold text-primary">Water Level Dynamics</h3>
              <p className="text-body-sm text-on-surface-variant">
                Historical readings + 30/60/90-day linear forecast
                {socketStatus === 'connected' && (
                  <span className="ml-2 text-status-optimal text-label-caps">● LIVE</span>
                )}
              </p>
            </div>
            <div className="flex gap-1">
              {RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRange(opt.value)}
                  className={`px-3 py-1 text-label-caps rounded transition-colors ${
                    range === opt.value
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <TrendChart
            readings={readings}
            forecast={trend?.forecast || []}
            criticalThreshold={station.critical_threshold_m}
          />
        </div>

        {/* Side metrics */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          {/* Decline rate gauge */}
          <div className={`bg-surface-container-lowest border border-border-subtle rounded-xl p-5 shadow-sm transition-all duration-700 ${gaugeFlash ? 'ring-2 ring-primary/40' : ''}`}>
            <h4 className="text-label-caps text-on-surface-variant uppercase mb-4">Depletion Rate</h4>
            <div className="flex flex-col items-center py-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="58" fill="transparent" stroke="#e8e8e8" strokeWidth="8" />
                  <circle
                    cx="64" cy="64" r="58" fill="transparent"
                    stroke={gaugeColor}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-headline-lg font-bold tabular-nums" style={{ color: gaugeColor }}>
                    {declineRate >= 0 ? '+' : ''}{parseFloat(declineRate).toFixed(3)}
                  </span>
                  <span className="text-label-caps text-on-surface-variant">m/month</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full text-body-sm" style={{ color: gaugeColor, backgroundColor: `${gaugeColor}15` }}>
                <span className="material-symbols-outlined text-sm">trending_down</span>
                <span className="text-label-caps font-bold">{status.toUpperCase()}</span>
              </div>
            </div>
            <p className="text-body-sm text-on-surface-variant text-center mt-2">
              Safe limit: {station.safe_decline_limit} m/month
            </p>
          </div>

          {/* Depth metric */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-5 shadow-sm">
            <h4 className="text-label-caps text-on-surface-variant uppercase mb-2">Current Depth</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-display font-bold text-primary tabular-nums">
                {station.latest_reading?.water_level_m != null
                  ? parseFloat(station.latest_reading.water_level_m).toFixed(2)
                  : '—'}
              </span>
              <span className="text-body-lg text-on-surface-variant">m BGL</span>
            </div>
            <div className="mt-3 pt-3 border-t border-border-subtle flex justify-between">
              <div>
                <span className="block text-label-caps text-on-surface-variant">THRESHOLD</span>
                <span className="text-body-md font-bold tabular-nums">{station.critical_threshold_m} m</span>
              </div>
              <div className="text-right">
                <span className="block text-label-caps text-on-surface-variant">AVG (TREND)</span>
                <span className="text-body-md font-bold tabular-nums">
                  {latestTrend.avg_level != null ? `${parseFloat(latestTrend.avg_level).toFixed(2)} m` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alert history */}
        <div className="col-span-12 bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center">
            <h3 className="text-body-lg font-bold text-primary">Station Alert History</h3>
            <span className="text-body-sm text-on-surface-variant">{alerts.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse zebra-table">
              <thead className="bg-surface-container-low border-b border-border-subtle">
                <tr>
                  {['Triggered At', 'Severity', 'Type', 'Message', 'Status'].map(h => (
                    <th key={h} className="px-6 py-3 text-label-caps text-on-surface-variant align-middle">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-body-sm">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant align-middle">No alerts for this station.</td>
                  </tr>
                ) : (
                  alerts.map(a => (
                    <tr key={a.alert_id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-3 tabular-nums text-body-sm align-middle">{formatDate(a.triggered_at)}</td>
                      <td className="px-6 py-3 align-middle">
                        <span className={`text-label-caps font-bold ${a.severity === 'critical' ? 'text-status-critical' : 'text-status-warning'}`}>
                          {a.severity?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-body-sm align-middle">{a.alert_type}</td>
                      <td className="px-6 py-3 max-w-xs truncate text-on-surface-variant text-body-sm align-middle">{a.message}</td>
                      <td className="px-6 py-3 align-middle">
                        <span className={`flex items-center gap-1 text-label-caps font-bold ${a.resolved ? 'text-status-optimal' : 'text-status-critical'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.resolved ? 'bg-status-optimal' : 'bg-status-critical animate-pulse'}`} />
                          {a.resolved ? 'Resolved' : 'Unresolved'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
