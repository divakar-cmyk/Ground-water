import { useState } from 'react';

export default function DataTable({ columns, data, onRowClick, emptyMessage = 'No data found.' }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const pageData = data.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-surface-container-lowest border border-border-subtle rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse zebra-table">
          <thead className="bg-surface-container-low border-b border-border-subtle">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-6 py-3 text-label-caps text-on-surface-variant uppercase">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-body-sm">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-on-surface-variant">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((row, i) => (
                <tr
                  key={i}
                  className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-surface-muted' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-6 py-3">
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-3 bg-surface-muted border-t border-border-subtle flex justify-between items-center">
          <span className="text-body-sm text-on-surface-variant">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.length)} of {data.length}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center border rounded text-body-sm font-bold transition-colors ${
                  p === page
                    ? 'bg-primary text-on-primary border-primary'
                    : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
