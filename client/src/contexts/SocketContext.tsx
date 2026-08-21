import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Only connect if user is authenticated and has a token
    if (isAuthenticated && accessToken) {
      const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const newSocket = io(socketUrl, {
        auth: { token: accessToken },
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('✅ Socket connected');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('❌ Socket disconnected');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      // If not authenticated, ensure socket is disconnected
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, accessToken]); // Re-run if auth state changes

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
