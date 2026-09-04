import { useEffect, useRef } from 'react';

/**
 * Hook for subscribing to real-time WebSocket events in the Admin Dashboard.
 * @param {Function} onMessage Callback invoked with ({ type, data, timestamp })
 */
export function useRealtime(onMessage) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      try {
        let wsUrl;
        const apiBase = import.meta.env.VITE_API_BASE || '';
        if (apiBase.startsWith('http')) {
          const wsBase = apiBase.replace(/^http/, 'ws');
          wsUrl = `${wsBase}/ws`;
        } else if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
          // Vercel serverless rewrites cannot proxy persistent WebSockets; connect directly to live Render backend
          wsUrl = 'wss://telegrammini-app-backend.onrender.com/api/ws';
        } else {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = `${protocol}//${window.location.host}/api/ws`;
        }
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Heartbeat ping
          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 20000);
          ws._pingInterval = pingInterval;
        };

        ws.onmessage = (event) => {
          try {
            if (event.data === 'pong' || event.data.includes('PONG')) return;
            const parsed = JSON.parse(event.data);
            if (onMessageRef.current) {
              onMessageRef.current(parsed);
            }
          } catch {
            // Ignore heartbeat
          }
        };

        ws.onclose = () => {
          if (ws._pingInterval) clearInterval(ws._pingInterval);
          if (isMounted) {
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          try {
            ws.close();
          } catch {}
        };
      } catch (err) {
        console.warn('Admin Realtime WebSocket error:', err);
        if (isMounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 4000);
        }
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        if (wsRef.current._pingInterval) clearInterval(wsRef.current._pingInterval);
        try {
          wsRef.current.close();
        } catch {}
      }
    };
  }, []);
}
