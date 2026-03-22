"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

function createSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const token =
    localStorage.getItem("token") ||
    (() => { try { return JSON.parse(localStorage.getItem("staff") || "{}").token; } catch { return undefined; } })();

  return io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3004", {
    transports: ["websocket", "polling"],
    auth: token ? { token } : {},
  });
}

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
  const [socket] = useState<Socket | null>(createSocket);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", (err) => {
      console.warn("[socket] connection error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
