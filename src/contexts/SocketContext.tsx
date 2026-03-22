"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

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
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  if (!socketRef.current && typeof window !== "undefined") {
    const token =
      localStorage.getItem("token") ||
      (() => { try { return JSON.parse(localStorage.getItem("staff") || "{}").token; } catch { return undefined; } })();

    socketRef.current = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3004", {
      transports: ["websocket", "polling"],
      auth: token ? { token } : {},
    });
  }

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    s.on("connect", () => setIsConnected(true));
    s.on("disconnect", () => setIsConnected(false));
    s.on("connect_error", (err) => {
      console.warn("[socket] connection error:", err.message);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
