import { useEffect, useState } from 'react';

const STATUS_OPTIONS = ['normal', 'warning', 'critical'];

const EMPTY = {
  station_name: '',
  location: '',
  latitude: '',
  longitude: '',
  aquifer_type: '',
  current_level: '',
  status: 'normal',
  last_sync: '',
};

function toFormValues(station) {
  if (!station) return EMPTY;
  return {
    station_name: station.station_name || '',
    location: station.location || '',
    latitude: station.latitude ?? '',
    longitude: station.longitude ?? '',
    aquifer_type: station.aquifer_type || '',
    current_level: station.current_level ?? '',
    status: station.status || 'normal',
    last_sync: station.last_sync
      ? new Date(station.last_sync).toISOString().slice(0, 16)
      : '',
  };
}

function validate(values) {
  const errors = {};
  if (!values.station_name.trim()) errors.station_name = 'Station name is required.';
  if (!values.location.trim()) errors.location = 'Location is required.';
  if (values.latitude === '' || isNaN(Number(values.latitude)))
    errors.latitude = 'Valid latitude is required.';
  if (values.longitude === '' || isNaN(Number(values.longitude)))
    errors.longitude = 'Valid longitude is required.';
  if (!values.aquifer_type.trim()) errors.aquifer_type = 'Aquifer type is required.';
  if (values.current_level === '' || isNaN(Number(values.current_level)) || Number(values.current_level) < 0)
    errors.current_level = 'Valid depth ≥ 0 is required.';
  if (!values.status) errors.status = 'Status is required.';
  if (!values.last_sync) errors.last_sync = 'Last sync date/time is required.';
  return errors;
}

export default function StationFormModal({ station, onSave, onClose, saving }) {
  const isEdit = Boolean(station);
  const [values, setValues] = useState(() => toFormValues(station));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setValues(toFormValues(station));
    setErrors({});
    setTouched({});
  }, [station]);

  function set(field, value) {
    setValues(v => ({ ...v, [field]: value }));
    if (touched[field]) {
      const errs = validate({ ...values, [field]: value });
      setErrors(e => ({ ...e, [field]: errs[field] }));
    }
  }

  function blur(field) {
    setTouched(t => ({ ...t, [field]: true }));
    const errs = validate(values);
    setErrors(e => ({ ...e, [field]: errs[field] }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(EMPTY).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave({
      ...values,
      latitude: parseFloat(values.latitude),
      longitude: parseFloat(values.longitude),
      current_level: parseFloat(values.current_level),
      last_sync: new Date(values.last_sync).toISOString(),
    });
  }

  const fields = [
    { key: 'station_name', label: 'Station Name', type: 'text', placeholder: 'e.g. DWLR-101' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g. Rajasthan North' },
    { key: 'latitude', label: 'Latitude', type: 'number', placeholder: 'e.g. 27.0238', step: '0.000001' },
    { key: 'longitude', label: 'Longitude', type: 'number', placeholder: 'e.g. 74.2179', step: '0.000001' },
    { key: 'aquifer_type', label: 'Aquifer Type', type: 'text', placeholder: 'e.g. Alluvial' },
    { key: 'current_level', label: 'Depth (m)', type: 'number', placeholder: 'e.g. 18.42', step: '0.01' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-xl border border-border-subtle shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between sticky top-0 bg-surface z-10">
          <div>
            <h3 className="text-body-lg font-bold text-primary">
              {isEdit ? `Edit ${station.station_name}` : 'Add New Station'}
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              {isEdit ? 'Update station details below.' : 'Fill in the details to register a new station.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
          >
            close
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Station ID (read-only in edit, hidden in add) */}
          {isEdit && (
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-1">Station ID</label>
              <input
                readOnly
                value={station.station_id}
                className="w-full h-9 px-3 bg-surface-container border border-outline-variant/30 rounded text-body-sm text-on-surface-variant cursor-not-allowed"
              />
            </div>
          )}

          {/* Text / number fields */}
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-label-caps text-on-surface-variant mb-1">
                {f.label} <span className="text-status-critical">*</span>
              </label>
              <input
                type={f.type}
                step={f.step}
                placeholder={f.placeholder}
                value={values[f.key]}
                onChange={e => set(f.key, e.target.value)}
                onBlur={() => blur(f.key)}
                className={`w-full h-9 px-3 bg-surface-container-low border rounded text-body-sm focus:ring-2 focus:ring-primary outline-none transition-colors ${
                  errors[f.key] && touched[f.key]
                    ? 'border-status-critical focus:ring-status-critical/30'
                    : 'border-outline-variant/30'
                }`}
              />
              {errors[f.key] && touched[f.key] && (
                <p className="text-[11px] text-status-critical mt-1">{errors[f.key]}</p>
              )}
            </div>
          ))}

          {/* Status */}
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1">
              Status <span className="text-status-critical">*</span>
            </label>
            <select
              value={values.status}
              onChange={e => set('status', e.target.value)}
              onBlur={() => blur('status')}
              className="w-full h-9 px-3 bg-surface-container-low border border-outline-variant/30 rounded text-body-sm focus:ring-2 focus:ring-primary outline-none"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Last Sync */}
          <div>
            <label className="block text-label-caps text-on-surface-variant mb-1">
              Last Sync <span className="text-status-critical">*</span>
            </label>
            <input
              type="datetime-local"
              value={values.last_sync}
              onChange={e => set('last_sync', e.target.value)}
              onBlur={() => blur('last_sync')}
              className={`w-full h-9 px-3 bg-surface-container-low border rounded text-body-sm focus:ring-2 focus:ring-primary outline-none transition-colors ${
                errors.last_sync && touched.last_sync
                  ? 'border-status-critical focus:ring-status-critical/30'
                  : 'border-outline-variant/30'
              }`}
            />
            {errors.last_sync && touched.last_sync && (
              <p className="text-[11px] text-status-critical mt-1">{errors.last_sync}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-border-subtle">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-primary text-on-primary text-label-caps rounded hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {saving && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
              {saving ? 'Saving...' : isEdit ? 'Update Station' : 'Add Station'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2 border border-outline-variant text-on-surface text-label-caps rounded hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
