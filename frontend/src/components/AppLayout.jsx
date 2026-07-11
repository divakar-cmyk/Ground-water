import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout({ children, title, alertCount = 0, socketStatus = 'disconnected' }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-muted">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: '260px' }}>
        <TopBar title={title} alertCount={alertCount} socketStatus={socketStatus} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
