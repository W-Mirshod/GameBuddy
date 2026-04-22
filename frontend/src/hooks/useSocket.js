import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket(token) {
  const [connected, setConnected] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!token) return undefined;
    const url = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_BASE_URL || '';
    const socket = io(url, { transports: ['websocket', 'polling'], auth: { token } });
    ref.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => {
      socket.disconnect();
      ref.current = null;
    };
  }, [token]);

  return { socket: ref.current, connected };
}
