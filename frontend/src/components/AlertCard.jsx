function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SEVERITY_STYLE = {
  critical: {
    border: 'border-status-critical',
    bg: 'bg-error-container/30',
    text: 'text-status-critical',
  },
  warning: {
    border: 'border-status-warning',
    bg: 'bg-status-warning/10',
    text: 'text-status-warning',
  },
};

export default function AlertCard({ alert }) {
  const style = SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.warning;
  return (
    <div className={`p-3 ${style.bg} border-l-4 ${style.border} rounded-r`}>
      <div className="flex justify-between items-start mb-1">
        <span className={`text-label-caps font-bold uppercase ${style.text}`}>{alert.alert_type}</span>
        <span className="text-[10px] text-on-surface-variant">{timeAgo(alert.triggered_at)}</span>
      </div>
      <p className="text-body-sm font-medium">{alert.station_name}</p>
      <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">{alert.message}</p>
    </div>
  );
}
