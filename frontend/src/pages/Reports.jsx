import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { LoadingState } from '../components/States';
import api from '../services/api';

export default function Reports() {
  const [searchParams] = useSearchParams();
  const [stations, setStations] = useState([]);
  const [selectedIds, setSelectedIds] = useState(
    searchParams.get('stationIds') ? searchParams.get('stationIds').split(',') : []
  );
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/stations')
      .then(res => setStations(res.data.data))
      .finally(() => setLoadingStations(false));
  }, []);

  function toggleStation(id) {
    const sid = String(id);
    setSelectedIds(prev =>
      prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]
    );
  }

  async function handleExport(format) {
    setExporting(true);
    try {
      const params = new URLSearchParams({ from, to, format });
      if (selectedIds.length > 0) params.set('stationIds', selectedIds.join(','));

      // Determine response type: blob for both PDF and CSV
      const responseType = format === 'csv' ? 'blob' : 'blob';
      const res = await api.get(`/reports?${params.toString()}`, {
        responseType,
      });

      const blob = new Blob([res.data], {
        type: format === 'csv' ? 'text/csv;charset=utf-8' : 'text/html;charset=utf-8',
      });

      if (format === 'pdf') {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `groundwater_report_${from}_${to}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppLayout title="Reports Generation">
      <div className="space-y-6">
        <div>
          <h2 className="text-headline-lg font-bold text-primary">Reports Generation</h2>
          <p className="text-body-md text-on-surface-variant">
            Configure data analysis and export professional monitoring reports.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Config panel */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-border-subtle p-6 rounded shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">filter_list</span>
              <h3 className="text-label-caps text-on-surface-variant">Report Configuration</h3>
            </div>

            <div className="space-y-5">
              {/* Station selection */}
              <div>
                <label className="block text-label-caps text-on-surface-variant mb-2">Select Stations</label>
                {loadingStations ? (
                  <LoadingState message="Loading stations..." />
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {stations.map(s => (
                      <label
                        key={s.station_id}
                        className="flex items-center gap-3 p-2 bg-surface-container-low rounded border border-transparent hover:border-outline-variant cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(String(s.station_id))}
                          onChange={() => toggleStation(s.station_id)}
                          className="rounded border-outline text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-body-sm flex-1">{s.station_name}</span>
                        <span className={`text-label-caps ${s.status === 'critical' ? 'text-status-critical' : s.status === 'warning' ? 'text-status-warning' : 'text-status-optimal'}`}>
                          {s.status || 'normal'}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedIds.length > 0 && (
                  <button
                    onClick={() => setSelectedIds([])}
                    className="mt-2 text-label-caps text-secondary hover:underline"
                  >
                    Clear selection ({selectedIds.length} selected)
                  </button>
                )}
              </div>

              {/* Date range */}
              <div>
                <label className="block text-label-caps text-on-surface-variant mb-2">Analysis Period</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-outline uppercase block mb-1">Start Date</span>
                    <input
                      type="date"
                      value={from}
                      onChange={e => setFrom(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded h-9 text-body-sm px-2 focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase block mb-1">End Date</span>
                    <input
                      type="date"
                      value={to}
                      onChange={e => setTo(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded h-9 text-body-sm px-2 focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Export buttons */}
              <div className="pt-4 border-t border-border-subtle space-y-2">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                  className="w-full py-2.5 bg-on-surface text-surface text-label-caps rounded flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  {exporting ? 'Generating...' : 'EXPORT PDF'}
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="w-full py-2.5 border border-outline text-on-surface text-label-caps rounded flex items-center justify-center gap-2 hover:bg-surface-container-low disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">table_view</span>
                  {exporting ? 'Generating...' : 'EXPORT CSV'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview pane */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-border-subtle rounded shadow-sm overflow-hidden flex flex-col">
            <div className="bg-surface-container-low px-6 py-4 border-b border-border-subtle flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">visibility</span>
                <h3 className="text-label-caps text-on-surface-variant">Report Preview</h3>
              </div>
            </div>

            <div className="p-6 flex-1 space-y-6">
              {/* Summary metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface-muted p-4 rounded border-l-4 border-primary">
                  <p className="text-label-caps text-outline uppercase">Stations Selected</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-display font-bold text-primary">
                      {selectedIds.length > 0 ? selectedIds.length : stations.length}
                    </span>
                    <span className="text-body-sm text-on-surface-variant">stations</span>
                  </div>
                </div>
                <div className="bg-surface-muted p-4 rounded border-l-4 border-on-tertiary-container">
                  <p className="text-label-caps text-outline uppercase">Date Range</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-body-md font-bold text-on-surface">
                      {Math.round((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">{from} → {to}</p>
                </div>
                <div className="bg-surface-muted p-4 rounded border-l-4 border-status-warning">
                  <p className="text-label-caps text-outline uppercase">Critical Stations</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-display font-bold text-status-warning">
                      {stations.filter(s => s.status === 'critical').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Station list preview */}
              <div className="border border-dashed border-outline-variant rounded p-4">
                <p className="text-label-caps text-on-surface-variant mb-3">STATIONS IN REPORT</p>
                <div className="space-y-2">
                  {(selectedIds.length > 0
                    ? stations.filter(s => selectedIds.includes(String(s.station_id)))
                    : stations
                  ).map(s => (
                    <div key={s.station_id} className="flex items-center justify-between text-body-sm">
                      <span className="font-medium">{s.station_name}</span>
                      <span className="text-on-surface-variant">{s.location}</span>
                      <span className={`text-label-caps font-bold ${
                        s.status === 'critical' ? 'text-status-critical' :
                        s.status === 'warning' ? 'text-status-warning' : 'text-status-optimal'
                      }`}>
                        {(s.status || 'normal').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary-container/10 p-4 rounded flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">info</span>
                <div>
                  <p className="text-body-sm font-bold text-primary">Export Note</p>
                  <p className="text-body-sm text-on-primary-fixed-variant mt-1">
                    PDF opens a print-ready view in a new tab. CSV downloads raw telemetry data for the selected period.
                    Leave stations unchecked to include all stations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
