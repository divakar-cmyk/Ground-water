import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

function timeAgo(dateStr) {
  if (!dateStr) return 'N/A';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * asRow=true  → renders only <td> cells (caller owns the <tr>)
 * asRow=false → renders a full <tr> (default)
 *
 * onView / onEdit / onDelete — when provided, an Actions column is rendered
 * and row-click navigation is suppressed.
 */
export default function StationCard({ station, asRow = false, onView, onEdit, onDelete }) {
  const navigate = useNavigate();
  const hasActions = onView || onEdit || onDelete;

  const decline = station.decline_rate;
  const declineDisplay = decline != null
    ? (decline >= 0 ? `+${parseFloat(decline).toFixed(3)}` : parseFloat(decline).toFixed(3))
    : 'N/A';
  const declineColor = decline > 0
    ? 'text-status-critical'
    : decline < 0
    ? 'text-status-optimal'
    : 'text-on-surface-variant';

  const cells = (
    <>
      <td className="px-6 py-3 font-medium text-primary text-body-sm tabular-nums align-middle">
        {station.station_name}
      </td>
      <td className="px-6 py-3 text-body-sm text-on-surface align-middle">
        {station.location || '—'}
      </td>
      <td className="px-6 py-3 text-body-sm tabular-nums align-middle">
        {station.current_level != null ? parseFloat(station.current_level).toFixed(2) : '—'}
      </td>
      <td className={`px-6 py-3 text-body-sm tabular-nums align-middle ${declineColor}`}>
        <span className="flex items-center gap-1">
          {decline != null && (
            <span className="material-symbols-outlined text-[16px] leading-none">
              {decline > 0 ? 'south' : decline < 0 ? 'north' : 'trending_flat'}
            </span>
          )}
          {declineDisplay}
        </span>
      </td>
      <td className="px-6 py-3 align-middle">
        <StatusBadge status={station.status || 'normal'} />
      </td>
      <td className="px-6 py-3 text-on-surface-variant text-body-sm align-middle">
        {timeAgo(station.last_sync)}
      </td>

      {hasActions && (
        <td className="px-6 py-3 align-middle">
          <div className="flex items-center gap-3">
            {onView && (
              <button
                onClick={e => { e.stopPropagation(); onView(station); }}
                className="flex items-center gap-1 text-secondary text-label-caps hover:underline"
                title="View details"
              >
                <span className="material-symbols-outlined text-[15px]">visibility</span>
                View
              </button>
            )}
            {onEdit && (
              <button
                onClick={e => { e.stopPropagation(); onEdit(station); }}
                className="flex items-center gap-1 text-primary text-label-caps hover:underline"
                title="Edit station"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(station); }}
                className="flex items-center gap-1 text-status-critical text-label-caps hover:underline"
                title="Delete station"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                Delete
              </button>
            )}
          </div>
        </td>
      )}
    </>
  );

  if (asRow) return cells;

  return (
    <tr
      className={`transition-colors ${hasActions ? '' : 'cursor-pointer hover:bg-surface-muted'}`}
      onClick={() => !hasActions && navigate(`/stations/${station.station_id}`)}
    >
      {cells}
    </tr>
  );
}
