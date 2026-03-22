"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import Topbar from "@/components/dashboard/Topbar";
import { useToast } from "@/contexts/ToastContext";
import { useSidebarToggle, useRestaurant } from "../layout";
import { useSubscriptionGate } from "@/components/shared/SubscriptionGate";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { SOCKET_EVENT } from "@/lib/events";
import { apiFetch } from "@/lib/api";
import { GridSkeleton } from "@/components/shared/Skeleton";
import type { ApiDiningTable } from "@/types";


const capacityOptions = [2, 4, 6, 8, 10, 12];

export default function TablesPage() {
  const toggleSidebar = useSidebarToggle();
  const restaurant = useRestaurant();
  const { showToast } = useToast();
  const { gate, checkSubscription } = useSubscriptionGate();
  const [tables, setTables] = useState<ApiDiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const restPhone = restaurant?.phone?.replace(/[^0-9]/g, "") || "";
  const [qrTable, setQrTable] = useState<ApiDiningTable | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tblLabel, setTblLabel] = useState("");
  const [tblCap, setTblCap] = useState(4);
  const [tblActive, setTblActive] = useState(true);
  const [savingTable, setSavingTable] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/tables")
      .then((r) => r.json())
      .then((body) => { setTables(Array.isArray(body.data) ? body.data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleTableUpdated = useCallback((t: Partial<ApiDiningTable> & { id: string }) => {
    setTables((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...t } : x)));
  }, []);

  useSocketEvent(SOCKET_EVENT.TABLE_UPDATED, handleTableUpdated);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Generate real QR code when modal opens
  useEffect(() => {
    if (!qrTable) { setQrDataUrl(null); return; }
    const url = typeof window !== "undefined" ? `${window.location.origin}/order/${qrTable.id}` : `/order/${qrTable.id}`;
    QRCode.toDataURL(url, { width: 320, margin: 2, color: { dark: "#1c1917", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [qrTable]);

  const occupied = tables.filter((t) => t.active && t.status === "OCCUPIED").length;
  const free = tables.filter((t) => t.active && t.status === "FREE").length;

  function openAddTable() {
    setEditingId(null);
    const nextNum = tables.length ? Math.max(...tables.map((t) => t.tableNumber)) + 1 : 1;
    setTblLabel(`Table ${nextNum}`);
    setTblCap(4);
    setTblActive(true);
    setEditModal(true);
  }

  function openEditTable(id: string) {
    const t = tables.find((x) => x.id === id);
    if (!t) return;
    setEditingId(id);
    setTblLabel(t.label);
    setTblCap(t.capacity);
    setTblActive(t.active);
    setEditModal(true);
  }

  async function saveTable() {
    if (!tblLabel.trim()) { alert("Please enter a table name."); return; }
    setSavingTable(true);
    try {
      if (editingId) {
        const res = await apiFetch(`/api/tables/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ label: tblLabel, capacity: tblCap, active: tblActive }),
        });
        if (res.ok) {
          const body = await res.json();
          const data = body.data;
          setTables((prev) => prev.map((x) => (x.id === editingId ? { ...x, ...data } : x)));
          showToast(`✅ ${tblLabel} updated!`);
        }
      } else {
        const res = await apiFetch("/api/tables", {
          method: "POST",
          body: JSON.stringify({ label: tblLabel, capacity: tblCap }),
        });
        if (res.ok) {
          const body = await res.json();
          const data = body.data;
          setTables((prev) => [...prev, data]);
          showToast(`✅ ${tblLabel} added!`);
        }
      }
    } catch {
      showToast("Failed to save table");
    }
    setSavingTable(false);
    setEditModal(false);
  }

  async function deleteTable(id: string) {
    const t = tables.find((x) => x.id === id);
    if (!t) return;
    if (t.status === "OCCUPIED") { alert(`${t.label} is currently occupied. Cannot delete.`); return; }
    if (!confirm(`Delete ${t.label}? This will also remove its QR code.`)) return;
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/tables/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTables((prev) => prev.filter((x) => x.id !== id));
        showToast(`🗑 ${t.label} removed.`);
      }
    } catch {
      showToast("Failed to delete table");
    }
    setDeletingId(null);
  }

  return (
    <>
      {gate}
      <Topbar title="Tables & QR Codes" onMenuToggle={toggleSidebar} />
      <div className="flex-1 p-4 animate-fadeIn sm:p-6">
        <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[10px]">
          <div>
            <div className="text-sm font-semibold">Tables & QR Codes</div>
            <div className="mt-0.5 text-xs text-text3">{tables.length} tables · {occupied} occupied · {free} free</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => showToast(`🖨 Preparing QR codes for all ${tables.filter((t) => t.active).length} active tables…`)} className="hidden items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text transition-all hover:bg-surface2 sm:inline-flex">🖨 Print All QR</button>
            <button onClick={() => checkSubscription("Add Table", openAddTable)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[13px] font-semibold text-white transition-all hover:bg-accent2 sm:px-[18px] sm:py-[9px]">+ Add Table</button>
          </div>
        </div>

        {/* Info bar */}
        <div className="mb-[18px] flex items-center gap-4 rounded-[10px] border border-border bg-surface px-[18px] py-[15px] shadow-[0_1px_3px_rgba(0,0,0,.07)]">
          <div className="text-[22px]">📱</div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">How QR codes work</div>
            <div className="text-xs text-text2">Each table gets a unique QR. Customer scans → browses menu → places order online. Print, laminate, place on table.</div>
          </div>
          <button onClick={() => showToast("🖨 Preparing QR codes…")} className="rounded-[7px] border border-border2 bg-transparent px-[11px] py-[5px] text-xs font-semibold text-text transition-all hover:bg-surface2">Preview all →</button>
        </div>

        {/* Tables grid */}
        {loading ? (
          <GridSkeleton count={6} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(158px,1fr))]">
            {tables.map((t) => (
              <div key={t.id} className={`relative rounded-xl border-[1.5px] p-4 transition-all hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,.08)] ${!t.active ? "border-dashed border-border opacity-50" : t.status === "OCCUPIED" ? "border-accent-border bg-accent-bg" : "border-border bg-surface"}`}>
                <div className="font-serif text-[32px] font-black leading-none tracking-[-0.03em]">{t.tableNumber}</div>
                <div className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-text3">Table · {t.capacity} seats</div>
                <div className={`mt-2 inline-flex items-center gap-1 rounded-[5px] px-2 py-[2px] font-mono text-[10px] font-bold ${!t.active ? "bg-surface2 text-text3" : t.status === "OCCUPIED" ? "bg-new-bg text-accent" : "bg-green-bg text-green-mid"}`}>
                  {!t.active ? "INACTIVE" : t.status === "OCCUPIED" ? "● OCCUPIED" : "● FREE"}
                </div>
                <div className="mt-[11px] flex gap-[5px]">
                  <button onClick={() => setQrTable(t)} className="flex-1 rounded-md bg-accent py-[5px] text-center text-[10px] font-semibold text-white hover:bg-accent2">QR</button>
                  <button onClick={() => checkSubscription("Edit Table", () => openEditTable(t.id))} className="flex-1 rounded-md border border-border bg-transparent py-[5px] text-center text-[10px] font-semibold text-text2 hover:bg-surface2">Edit</button>
                  <button onClick={() => deleteTable(t.id)} disabled={deletingId === t.id} className="flex-1 rounded-md border border-border bg-transparent py-[5px] text-center text-[10px] font-semibold text-red hover:bg-red-bg hover:border-[rgba(153,27,27,.2)] disabled:opacity-50">{deletingId === t.id ? "..." : "✕"}</button>
                </div>
              </div>
            ))}
            <div onClick={() => checkSubscription("Add Table", openAddTable)} className="flex min-h-[148px] cursor-pointer flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-border2 bg-transparent p-4 text-text3 transition-all hover:border-accent hover:bg-accent-bg hover:text-accent">
              <div className="mb-2 text-[28px]">＋</div>
              <div className="text-xs font-bold">Add Table</div>
            </div>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrTable && (
        <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/50 backdrop-blur-[4px] animate-fadeO" onClick={(e) => e.target === e.currentTarget && setQrTable(null)}>
          <div className="mx-4 w-full max-w-[360px] overflow-hidden rounded-2xl bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">QR Code — {qrTable.label}</div>
              <button onClick={() => setQrTable(null)} className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 hover:bg-red-bg hover:text-red">✕</button>
            </div>
            <div className="p-6 text-center">
              <div className="mx-auto mb-[14px] flex h-[180px] w-[180px] items-center justify-center rounded-[10px] border border-border bg-white">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR code for ${qrTable.label}`} className="h-[160px] w-[160px]" />
                ) : (
                  <div className="text-sm text-text3">Generating...</div>
                )}
              </div>
              <div className="mb-1 font-serif text-xl font-extrabold">{qrTable.label}</div>
              <div className="mb-2 text-xs text-text2">Scan to order online</div>
              <div className="mb-4 break-all rounded-md bg-surface2 px-[10px] py-2 text-left font-mono text-[10px] leading-[1.5] text-text3">
                {typeof window !== "undefined" ? `${window.location.origin}/order/${qrTable.id}` : `/order/${qrTable.id}`}
              </div>
            </div>
            <div className="flex gap-2 border-t border-border px-5 py-[14px]">
              <button onClick={() => setQrTable(null)} className="flex flex-1 items-center justify-center rounded-lg border-[1.5px] border-border2 bg-transparent py-[9px] text-[13px] font-semibold text-text hover:bg-surface2">Cancel</button>
              <button onClick={() => { showToast("🖨 Sending to printer…"); setQrTable(null); }} className="flex flex-1 items-center justify-center rounded-lg border-[1.5px] border-border2 bg-transparent py-[9px] text-[13px] font-semibold text-text hover:bg-surface2">🖨 Print</button>
              <button onClick={() => { showToast(`📥 QR for ${qrTable.label} downloading…`); setQrTable(null); }} className="flex flex-1 items-center justify-center rounded-lg bg-accent py-[9px] text-[13px] font-semibold text-white hover:bg-accent2">⬇ Download</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Table Modal */}
      {editModal && (
        <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO" onClick={(e) => e.target === e.currentTarget && setEditModal(false)}>
          <div className="mx-4 w-full max-w-[400px] overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">{editingId ? `Edit ${tblLabel}` : "Add New Table"}</div>
              <button onClick={() => setEditModal(false)} className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 hover:bg-red-bg hover:text-red">✕</button>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Table Name / Label *</label>
                <input className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent" placeholder="e.g. Table 9 or VIP Booth" value={tblLabel} onChange={(e) => setTblLabel(e.target.value)} />
                <div className="mt-1 text-[11px] text-text3">This label appears in owner notifications and order history</div>
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Seating Capacity</label>
                <div className="flex flex-wrap gap-2">
                  {capacityOptions.map((n) => (
                    <div key={n} onClick={() => setTblCap(n)} className={`cursor-pointer rounded-[7px] border-[1.5px] px-[14px] py-[7px] text-[13px] font-semibold transition-all ${tblCap === n ? "border-accent bg-accent-bg text-accent" : "border-border hover:bg-surface2"}`}>{n}</div>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-[5px] block text-xs font-semibold text-text2">Status</label>
                <div className="flex items-center justify-between rounded-lg border border-border bg-surface2 px-[13px] py-[10px]">
                  <div>
                    <div className="text-[13px] font-medium">Table Active</div>
                    <div className="mt-[1px] text-[11px] text-text3">Inactive tables are hidden from QR list and bot</div>
                  </div>
                  <button onClick={() => setTblActive(!tblActive)} className={`relative h-[18px] w-8 shrink-0 cursor-pointer rounded-[9px] border-none transition-colors ${tblActive ? "bg-green-mid" : "bg-border2"}`}>
                    <div className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-[left] ${tblActive ? "left-[17px]" : "left-[3px]"}`} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-[14px]">
              <button onClick={() => setEditModal(false)} className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text hover:bg-surface2">Cancel</button>
              <button onClick={saveTable} disabled={savingTable} className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white hover:bg-accent2 disabled:opacity-50">{savingTable ? "Saving..." : editingId ? "Save Changes" : "Add Table"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
