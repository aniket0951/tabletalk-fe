"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { STORAGE_KEY } from "@/lib/storage-keys";
import { SOCKET_EVENT } from "@/lib/events";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token =
      localStorage.getItem(STORAGE_KEY.TOKEN) ||
      (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY.STAFF) || "{}").token; } catch { return undefined; } })();

    const s = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3004", {
      transports: ["websocket", "polling"],
      auth: token ? { token } : {},
    });

    socketRef.current = s;
    setSocket(s);

    s.on(SOCKET_EVENT.CONNECT, () => setIsConnected(true));
    s.on(SOCKET_EVENT.DISCONNECT, () => setIsConnected(false));
    s.on(SOCKET_EVENT.CONNECT_ERROR, (err) => {
      console.warn("[socket] connection error:", err.message);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
