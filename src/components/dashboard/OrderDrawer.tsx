"use client";

import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { apiFetch } from "@/lib/api";
import type { ApiOrder, ApiStaff } from "@/types";

interface OrderDrawerProps {
  order: ApiOrder | null;
  onClose: () => void;
  onOrderUpdate?: (order: ApiOrder) => void;
  staffList?: ApiStaff[];
}

const statusMap: Record<string, { cls: string; label: string }> = {
  NEW: { cls: "bg-new-bg text-accent", label: "NEW" },
  COOKING: { cls: "bg-amber-bg text-amber", label: "COOKING" },
  READY: { cls: "bg-green-bg text-green-mid", label: "READY" },
  BILLED: { cls: "bg-blue-bg text-blue", label: "BILL SENT" },
  SETTLED: { cls: "bg-surface2 text-text3", label: "SETTLED" },
};

const timeline = [
  { key: "placedAt", label: "Order Placed", icon: "📱" },
  { key: "confirmedAt", label: "Confirmed", icon: "✓" },
  { key: "cookingAt", label: "Kitchen Cooking", icon: "🍳" },
  { key: "readyAt", label: "Ready to Serve", icon: "🔔" },
  { key: "billedAt", label: "Bill Sent", icon: "🧾" },
  { key: "settledAt", label: "Settled", icon: "✅" },
];

const statusOrder = ["placedAt", "confirmedAt", "cookingAt", "readyAt", "billedAt", "settledAt"];

function formatTime(dateStr: string | null) {
  if (!dateStr) return "Pending";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function OrderDrawer({ order, onClose, onOrderUpdate, staffList = [] }: OrderDrawerProps) {
  const { showToast } = useToast();
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!order) return null;

  const sub = order.subtotal;
  const tax = order.tax;
  const st = statusMap[order.status] || statusMap.NEW;

  const currentStatusKey = {
    NEW: "confirmedAt",
    COOKING: "cookingAt",
    READY: "readyAt",
    BILLED: "billedAt",
    SETTLED: "settledAt",
  }[order.status] || "placedAt";
  const currentIdx = statusOrder.indexOf(currentStatusKey);

  async function handleAction(nextStatus: string, label: string) {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/orders/${order!.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        onOrderUpdate?.(updated);
        showToast(`${label}`);
      } else {
        showToast("Failed to update order");
      }
    } catch {
      showToast("Failed to update order");
    }
    setActionLoading(false);
    onClose();
  }

  async function handleStaffAssign(staffId: string) {
    setAssigningStaff(true);
    try {
      const res = await apiFetch(`/api/orders/${order!.id}`, {
        method: "PATCH",
        body: JSON.stringify({ staffId: staffId || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        onOrderUpdate?.(updated);
        const staffName = staffList.find((s) => s.id === staffId)?.name;
        showToast(staffId ? `Assigned to ${staffName}` : "Staff unassigned");
      } else {
        showToast("Failed to assign staff");
      }
    } catch {
      showToast("Failed to assign staff");
    }
    setAssigningStaff(false);
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-200 bg-black/35 backdrop-blur-[2px] ${order ? "block animate-fadeO" : "hidden"}`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 z-201 flex h-screen w-full flex-col border-l border-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] transition-transform duration-300 sm:w-[460px] ${
          order ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-sm font-bold">
              {order.orderCode} · {order.table?.label || "Unknown"}
            </div>
            <div className="mt-1">
              <span className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] font-mono text-[10px] font-bold tracking-[0.04em] ${st.cls}`}>
                {st.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-border bg-surface2 text-[15px] text-text2 transition-all hover:bg-red-bg hover:text-red"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Customer */}
          <div className="border-b border-border px-5 py-[14px]">
            <div className="mb-[10px] font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-text3">
              Customer
            </div>
            <div className="mb-1.5 flex justify-between"><span className="text-xs text-text2">Table</span><span className="text-xs font-semibold">{order.table?.label || "—"}</span></div>
            <div className="mb-1.5 flex justify-between"><span className="text-xs text-text2">Phone</span><span className="font-mono text-xs font-semibold">{order.customerPhone}</span></div>
            <div className="mb-1.5 flex justify-between"><span className="text-xs text-text2">Placed at</span><span className="font-mono text-xs font-semibold">{formatTime(order.placedAt)}</span></div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-text2">Assigned to</span>
              <select
                className="rounded-[5px] border border-border bg-surface px-2 py-[3px] text-xs font-semibold outline-none focus:border-accent"
                value={order.staffId || ""}
                onChange={(e) => handleStaffAssign(e.target.value)}
                disabled={assigningStaff}
              >
                <option value="">Unassigned</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
            {order.specialNote && (
              <div className="flex justify-between"><span className="text-xs text-text2">Note</span><span className="text-xs font-semibold italic text-amber">&quot;{order.specialNote}&quot;</span></div>
            )}
          </div>

          {/* Items */}
          <div className="border-b border-border px-5 py-[14px]">
            <div className="mb-[10px] font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-text3">
              Items
            </div>
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-[10px] border-b border-border py-2 last:border-b-0">
                <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] border border-border bg-surface2 font-mono text-[11px] font-bold">
                  {item.quantity}×
                </div>
                <div className="flex-1 text-xs font-medium">{item.menuItem.name}</div>
                <div className={`h-[10px] w-[10px] shrink-0 rounded-[2px] ${item.menuItem.type === "VEG" ? "bg-green-mid" : "bg-red"}`} />
                <div className="font-mono text-xs font-semibold">₹{item.quantity * item.unitPrice}</div>
              </div>
            ))}
            <div className="mt-3">
              <div className="mb-1.5 flex justify-between text-[13px]"><span className="text-text2">Subtotal</span><span className="font-mono">₹{sub}</span></div>
              <div className="mb-1.5 flex justify-between text-[13px]"><span className="text-text2">GST (5%)</span><span className="font-mono">₹{tax}</span></div>
              <div className="mt-[3px] flex justify-between border-t border-border pt-[9px] text-sm font-bold"><span>Total</span><span className="font-mono">₹{order.total}</span></div>
            </div>
          </div>

          {/* Timeline */}
          <div className="px-5 py-[14px]">
            <div className="mb-[10px] font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-text3">
              Timeline
            </div>
            {timeline.map((step, i) => {
              const value = order[step.key as keyof ApiOrder] as string | null;
              const isDone = !!value && i < currentIdx;
              const isActive = i === currentIdx;
              return (
                <div key={step.key} className="relative flex items-start gap-[11px] pb-[13px] last:pb-0">
                  {i < timeline.length - 1 && (
                    <div className="absolute bottom-0 left-[9px] top-5 w-px bg-border" />
                  )}
                  <div
                    className={`z-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[9px] ${
                      isDone
                        ? "border-green-mid bg-green-mid text-white"
                        : isActive
                        ? "border-accent bg-accent text-white shadow-[0_0_0_3px_rgba(212,82,42,.15)]"
                        : "border-border bg-surface2"
                    }`}
                  >
                    {isDone ? "✓" : isActive ? step.icon : ""}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{step.label}</div>
                    <div className="mt-[1px] font-mono text-[11px] text-text3">
                      {formatTime(value)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-border bg-surface px-5 py-3">
          {order.status === "NEW" && (
            <>
              <button onClick={() => handleAction("COOKING", "Marked as cooking")} disabled={actionLoading} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[rgba(22,101,52,.2)] bg-green-bg px-[18px] py-[9px] text-[13px] font-semibold text-green disabled:opacity-50">
                {actionLoading ? "Updating..." : "✓ Mark Cooking"}
              </button>
              <button onClick={onClose} className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text transition-all hover:bg-surface2">
                Reject
              </button>
            </>
          )}
          {order.status === "COOKING" && (
            <button onClick={() => handleAction("READY", "Marked as ready")} disabled={actionLoading} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[rgba(22,101,52,.2)] bg-green-bg px-[18px] py-[9px] text-[13px] font-semibold text-green disabled:opacity-50">
              {actionLoading ? "Updating..." : "🔔 Mark Ready"}
            </button>
          )}
          {order.status === "READY" && (
            <button onClick={() => handleAction("BILLED", "Bill sent")} disabled={actionLoading} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white hover:bg-accent2 disabled:opacity-50">
              {actionLoading ? "Updating..." : "🧾 Send Bill"}
            </button>
          )}
          {order.status === "BILLED" && (
            <button onClick={() => handleAction("SETTLED", "Marked as settled")} disabled={actionLoading} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[rgba(22,101,52,.2)] bg-green-bg px-[18px] py-[9px] text-[13px] font-semibold text-green disabled:opacity-50">
              {actionLoading ? "Updating..." : "✅ Mark Settled"}
            </button>
          )}
          {order.status === "SETTLED" && (
            <button disabled className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text opacity-50">
              ✅ Complete
            </button>
          )}
        </div>
      </div>
    </>
  );
}
