export default function MetricSummaryCard({ label, value, unit, icon, valueClass = 'text-primary' }) {
  return (
    <div className="bg-surface-container-lowest p-4 border border-border-subtle rounded-lg shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-label-caps text-on-surface-variant uppercase">{label}</p>
        <span className={`material-symbols-outlined text-[20px] opacity-30 ${valueClass}`}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-display font-bold leading-none ${valueClass}`}>{value}</span>
        {unit && <span className="text-body-sm font-normal text-on-surface-variant">{unit}</span>}
      </div>
    </div>
  );
}
