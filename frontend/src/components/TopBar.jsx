import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectionStatus from './ConnectionStatus';

export default function TopBar({ title = 'Resource Management Console', alertCount = 0, socketStatus = 'disconnected' }) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) navigate(`/stations?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-surface border-b border-border-subtle shrink-0 sticky top-0 z-40 gap-4">
      {/* Left: title + connection status */}
      <div className="flex items-center gap-3 min-w-0 shrink">
        <span className="text-body-lg font-bold text-primary truncate">{title}</span>
        <span className="h-4 w-px bg-outline-variant shrink-0" />
        <ConnectionStatus status={socketStatus} />
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-3 shrink-0">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-2 text-[18px] text-outline pointer-events-none">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stations..."
            className="h-8 pl-8 pr-4 bg-surface-container-low border border-outline-variant/30 rounded text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-52 transition-all"
          />
        </form>

        <div className="flex items-center gap-2 text-on-surface-variant">
          <button
            onClick={() => window.location.reload()}
            className="material-symbols-outlined text-[22px] hover:text-primary active:scale-95 transition-all leading-none"
          >
            sync
          </button>
          <button
            onClick={() => navigate('/alerts')}
            className="relative hover:text-primary active:scale-95 transition-all leading-none"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-error rounded-full border-2 border-surface" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
