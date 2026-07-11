export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
      <span className="material-symbols-outlined text-[40px] animate-spin text-primary">sync</span>
      <p className="text-body-md">{message}</p>
    </div>
  );
}

export function EmptyState({ message = 'No records found.', icon = 'inbox' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
      <span className="material-symbols-outlined text-[48px] opacity-30">{icon}</span>
      <p className="text-body-md">{message}</p>
    </div>
  );
}

export function ErrorState({ message = 'Failed to load data.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-3">
      <span className="material-symbols-outlined text-[48px] text-status-critical opacity-60">error_outline</span>
      <p className="text-body-md text-status-critical">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-primary text-on-primary text-body-sm rounded hover:opacity-90"
        >
          Retry
        </button>
      )}
    </div>
  );
}
