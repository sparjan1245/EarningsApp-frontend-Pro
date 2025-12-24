import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../app/useAuth';

// Helper to get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Global socket instance to prevent multiple connections
let globalSocket: Socket | null = null;
let globalSocketNamespace = '';

export function useSocket(namespace: string = '/chat') {
  const { accessToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Try to get token from auth context or cookie
    const token = accessToken || getCookie('access');
    if (!token) {
      console.warn('No access token found, socket connection skipped');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        globalSocket = null;
      }
      setIsConnected(false);
      return;
    }

    // Reuse existing socket if namespace matches
    if (globalSocket && globalSocketNamespace === namespace && globalSocket.connected) {
      socketRef.current = globalSocket;
      setIsConnected(true);
      return;
    }

    // Disconnect existing socket if namespace changed
    if (globalSocket && globalSocketNamespace !== namespace) {
      globalSocket.disconnect();
      globalSocket = null;
    }

    // Use environment variable or fallback to localhost for development
    const wsUrl = import.meta.env.VITE_BACKEND_WS_URL || 'http://localhost:3002';
    const socket = io(`${wsUrl}${namespace}`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        token: token,
      },
      query: {
        token: token,
      },
    });

    socket.on('connect', () => {
      console.log('🔌 [Socket] Connected successfully', { 
        socketId: socket.id, 
        namespace,
        url: `${wsUrl}${namespace}`,
      });
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [Socket] Disconnected:', reason);
      setIsConnected(false);
      // Only clear global socket if it's a server disconnect or transport close
      if (reason === 'io server disconnect' || reason === 'transport close') {
        globalSocket = null;
        globalSocketNamespace = '';
      }
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 [Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    // Add reconnect event listener
    socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 [Socket] Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    // Add reconnecting event listener
    socket.on('reconnecting', (attemptNumber) => {
      console.log('🔌 [Socket] Reconnecting... attempt', attemptNumber);
    });

    socketRef.current = socket;
    globalSocket = socket;
    globalSocketNamespace = namespace;

    return () => {
      // Don't disconnect if this is just a component unmount but socket is still in use
      // Only disconnect if this is the last reference
      if (socketRef.current === globalSocket) {
        // Check if socket is still needed by other components
        // For now, we'll keep it connected until explicit cleanup
      }
    };
  }, [accessToken, namespace]);

  return { socket: socketRef.current, isConnected };
}

