import { useEffect, useRef, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import useAuthStore from '../context/authStore';

/**
 * Connection status values: 'connected' | 'reconnecting' | 'disconnected'
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    const s = getSocket();
    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onReconnecting = () => setStatus('reconnecting');
    const onReconnect = () => setStatus('connected');

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('reconnect_attempt', onReconnecting);
    s.on('reconnect', onReconnect);

    // Reflect current state immediately
    if (s.connected) setStatus('connected');

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('reconnect_attempt', onReconnecting);
      s.off('reconnect', onReconnect);
    };
  }, []);

  return status;
}

/**
 * Main hook — call once at app level (in App.jsx) to open the socket after login.
 * Returns { status }.
 */
export function useSocketConnection() {
  const { token } = useAuthStore();
  const status = useConnectionStatus();

  useEffect(() => {
    // Only connect after a token exists AND we are no longer on the login page.
    // This prevents the socket from firing a 401 mid-login and reloading the page.
    if (token && window.location.pathname !== '/login') {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [token]);

  return { status };
}

/**
 * Subscribe to a socket room and listen for specific events.
 *
 * @param {string|null} room  - Room to join, e.g. 'dashboard' or 'station:4'. null = skip.
 * @param {Object} handlers   - Map of { eventName: callbackFn }
 * @param {Array}  deps       - Extra deps that should re-subscribe (e.g. [stationId])
 */
export function useSocketRoom(room, handlers, deps = []) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!room) return;
    const s = getSocket();

    // Join room
    if (room !== 'dashboard') {
      // dashboard room is joined automatically on connect by the server
      const [type, id] = room.split(':');
      if (type === 'station' && id) s.emit('join:station', id);
    }

    // Register event listeners
    const entries = Object.entries(handlersRef.current);
    entries.forEach(([event, fn]) => {
      s.on(event, fn);
    });

    return () => {
      // Leave room
      if (room !== 'dashboard') {
        const [type, id] = room.split(':');
        if (type === 'station' && id) s.emit('leave:station', id);
      }
      entries.forEach(([event, fn]) => {
        s.off(event, fn);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, ...deps]);
}

/**
 * Fallback polling hook — polls a fetch function every `intervalMs` when disconnected,
 * and once immediately on reconnect.
 *
 * @param {Function} fetchFn      - async function to call
 * @param {string}   socketStatus - from useConnectionStatus()
 * @param {number}   intervalMs   - polling interval when disconnected (default 30s)
 */
export function useFallbackPolling(fetchFn, socketStatus, intervalMs = 30000) {
  const timerRef = useRef(null);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  useEffect(() => {
    if (socketStatus === 'connected') {
      // Reconnected — do one immediate resync then stop polling
      fetchRef.current();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      // Disconnected or reconnecting — start polling if not already
      if (!timerRef.current) {
        timerRef.current = setInterval(() => fetchRef.current(), intervalMs);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [socketStatus, intervalMs]);
}
