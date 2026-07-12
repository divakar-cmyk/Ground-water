import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './context/authStore';
import { useSocketConnection } from './hooks/useRealtimeData';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Stations from './pages/Stations';
import StationDetail from './pages/StationDetail';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';

function ProtectedRoute({ children, adminOnly = false }) {
  const { token, isAdmin } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppWithSocket() {
  // Opens/closes socket based on auth token — runs for the lifetime of the app
  try {
    useSocketConnection();
  } catch (err) {
    console.error('Socket hook failed', err);
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/stations" element={
        <ProtectedRoute><Stations /></ProtectedRoute>
      } />
      <Route path="/stations/:id" element={
        <ProtectedRoute><StationDetail /></ProtectedRoute>
      } />
      <Route path="/alerts" element={
        <ProtectedRoute><Alerts /></ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute><Reports /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppWithSocket />
    </BrowserRouter>
  );
}
