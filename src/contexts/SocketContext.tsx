"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Send auth token in handshake if available (owner or staff)
    const token = typeof window !== "undefined"
      ? localStorage.getItem("token") || (() => { try { return JSON.parse(localStorage.getItem("staff") || "{}").token; } catch { return undefined; } })()
      : undefined;

    const s = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3004", {
      transports: ["websocket", "polling"],
      auth: token ? { token } : {},
    });

    s.on("connect", () => setIsConnected(true));
    s.on("disconnect", () => setIsConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
