const CONFIG = {
  connected: {
    dot: 'bg-status-optimal animate-pulse',
    text: 'text-status-optimal',
    label: 'LIVE',
  },
  reconnecting: {
    dot: 'bg-status-warning animate-pulse',
    text: 'text-status-warning',
    label: 'RECONNECTING…',
  },
  disconnected: {
    dot: 'bg-outline',
    text: 'text-on-surface-variant',
    label: 'OFFLINE — DATA MAY BE STALE',
  },
};

export default function ConnectionStatus({ status }) {
  const cfg = CONFIG[status] || CONFIG.disconnected;
  return (
    <span className={`flex items-center gap-1.5 text-label-caps font-bold ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
