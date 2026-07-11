const STATUS_CONFIG = {
  critical: {
    bg: 'bg-status-critical/10',
    text: 'text-status-critical',
    border: 'border-status-critical/20',
    icon: 'report',
    label: 'Critical',
  },
  warning: {
    bg: 'bg-status-warning/10',
    text: 'text-status-warning',
    border: 'border-status-warning/20',
    icon: 'warning',
    label: 'Warning',
  },
  normal: {
    bg: 'bg-status-optimal/10',
    text: 'text-status-optimal',
    border: 'border-status-optimal/20',
    icon: 'check_circle',
    label: 'Normal',
  },
  optimal: {
    bg: 'bg-status-optimal/10',
    text: 'text-status-optimal',
    border: 'border-status-optimal/20',
    icon: 'check_circle',
    label: 'Optimal',
  },
  resolved: {
    bg: 'bg-status-optimal/10',
    text: 'text-status-optimal',
    border: 'border-status-optimal/20',
    icon: 'check_circle',
    label: 'Resolved',
  },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.normal;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-label-caps font-bold uppercase ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className="material-symbols-outlined text-[12px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
