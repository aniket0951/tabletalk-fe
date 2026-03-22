"use client";

import { createContext, useContext, useEffect, useState, use } from "react";
import { SocketProvider } from "@/contexts/SocketContext";
import { CartProvider } from "@/contexts/CartContext";
import { publicFetch } from "@/lib/api";
import type { PublicTableInfo } from "@/types";

const TableInfoContext = createContext<PublicTableInfo | null>(null);
export function useTableInfo() { return useContext(TableInfoContext); }

export default function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = use(params);
  const [tableInfo, setTableInfo] = useState<PublicTableInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    publicFetch(`/public/table/${tableId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Table not found");
        return r.json();
      })
      .then((body) => setTableInfo(body.data))
      .catch(() => setError("Table not found"));
  }, [tableId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-4xl">😕</div>
          <div className="text-lg font-semibold">Table not found</div>
          <div className="mt-1 text-sm text-text2">This QR code may be invalid or expired.</div>
        </div>
      </div>
    );
  }

  if (!tableInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-text3">Loading...</div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <CartProvider tableId={tableId}>
        <TableInfoContext.Provider value={tableInfo}>
          <div className="mx-auto min-h-screen max-w-lg bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-border bg-surface px-4 py-3">
              <div className="text-base font-bold">{tableInfo.restaurant.name}</div>
              <div className="text-xs text-text2">{tableInfo.label} · {tableInfo.capacity} seats</div>
            </header>

            <main>{children}</main>
          </div>
        </TableInfoContext.Provider>
      </CartProvider>
    </SocketProvider>
  );
}
