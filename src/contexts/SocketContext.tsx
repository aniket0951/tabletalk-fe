"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { STORAGE_KEY } from "@/lib/storage-keys";
import { SOCKET_EVENT } from "@/lib/events";

function createSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const token =
    localStorage.getItem(STORAGE_KEY.TOKEN) ||
    (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY.STAFF) || "{}").token; } catch { return undefined; } })();

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

    // React Strict Mode runs cleanup+remount once on dev mount.
    // socket.disconnect() sets socket.active = false and disables auto-reconnect.
    // Calling connect() here recovers from that cleanup without creating a new socket.
    if (!socket.active) socket.connect();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err: Error) =>
      console.warn("[socket] connection error:", err.message);

    socket.on(SOCKET_EVENT.CONNECT, handleConnect);
    socket.on(SOCKET_EVENT.DISCONNECT, handleDisconnect);
    socket.on(SOCKET_EVENT.CONNECT_ERROR, handleError);

    return () => {
      socket.off(SOCKET_EVENT.CONNECT, handleConnect);
      socket.off(SOCKET_EVENT.DISCONNECT, handleDisconnect);
      socket.off(SOCKET_EVENT.CONNECT_ERROR, handleError);
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
