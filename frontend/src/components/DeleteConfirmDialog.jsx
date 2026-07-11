export default function DeleteConfirmDialog({ stationName, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-surface rounded-xl border border-border-subtle shadow-xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <span className="material-symbols-outlined text-[32px] text-status-critical shrink-0">delete_forever</span>
          <div>
            <h3 className="text-body-lg font-bold text-on-surface">Delete Station</h3>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Are you sure you want to delete{' '}
              <span className="font-bold text-on-surface">{stationName}</span>?
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2 bg-status-critical text-white text-label-caps rounded hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {deleting && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2 border border-outline-variant text-on-surface text-label-caps rounded hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
