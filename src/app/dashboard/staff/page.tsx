"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/dashboard/Topbar";
import OrderDrawer from "@/components/dashboard/OrderDrawer";
import { useToast } from "@/contexts/ToastContext";
import { useSidebarToggle } from "../layout";
import { useSubscriptionGate } from "@/components/shared/SubscriptionGate";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { apiFetch } from "@/lib/api";
import type { ApiStaff, ApiOrder, StaffRole } from "@/types";

export default function StaffPage() {
  const toggleSidebar = useSidebarToggle();
  const { showToast } = useToast();
  const { gate, checkSubscription } = useSubscriptionGate();
  const [staff, setStaff] = useState<ApiStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<StaffRole>("WAITER");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<ApiStaff | null>(null);
  const [staffOrders, setStaffOrders] = useState<ApiOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [dateFilter, setDateFilter] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    apiFetch("/api/staff")
      .then((r) => r.json())
      .then((data) => { setStaff(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleStaffCreated = useCallback((s: ApiStaff) => {
    setStaff((prev) => [...prev, s]);
  }, []);

  const handleStaffUpdated = useCallback((s: ApiStaff) => {
    setStaff((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  }, []);

  const handleStaffDeleted = useCallback((data: { id: string }) => {
    setStaff((prev) => prev.filter((x) => x.id !== data.id));
  }, []);

  useSocketEvent("staff:created", handleStaffCreated);
  useSocketEvent("staff:updated", handleStaffUpdated);
  useSocketEvent("staff:deleted", handleStaffDeleted);

  function openAdd() {
    setEditingId(null);
    setName("");
    setPhone("");
    setPin("");
    setRole("WAITER");
    setFormError("");
    setShowPin(false);
    setEditModal(true);
  }

  function openEdit(id: string) {
    const s = staff.find((x) => x.id === id);
    if (!s) return;
    setEditingId(id);
    setName(s.name);
    setPhone(s.phone);
    setPin(s.pin);
    setRole(s.role);
    setFormError("");
    setShowPin(false);
    setEditModal(true);
  }

  async function handleSave() {
    setFormError("");
    if (!name.trim()) { setFormError("Name is required"); return; }
    if (!/^\d{4}$/.test(pin)) { setFormError("PIN must be exactly 4 digits"); return; }
    setSaving(true);
    try {
      const url = editingId ? `/api/staff/${editingId}` : "/api/staff";
      const res = await apiFetch(url, {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({ name, phone, pin, role }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(editingId ? `${name} updated!` : `${name} added!`);
        setEditModal(false);
      } else {
        setFormError(data.error || "Failed to save staff");
      }
    } catch {
      setFormError("Failed to save staff");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const s = staff.find((x) => x.id === id);
    if (!s) return;
    if (!confirm(`Remove ${s.name}? Their order assignments will remain.`)) return;
    try {
      const res = await apiFetch(`/api/staff/${id}`, { method: "DELETE" });
      if (res.ok) showToast(`${s.name} removed`);
    } catch {
      showToast("Failed to remove staff");
    }
  }

  const statusGroups = ["NEW", "COOKING", "READY", "BILLED", "SETTLED"];
  const statusConfig: Record<string, { label: string; icon: string; cls: string }> = {
    NEW: { label: "New", icon: "📱", cls: "bg-new-bg text-accent" },
    COOKING: { label: "Cooking", icon: "🍳", cls: "bg-amber-bg text-amber" },
    READY: { label: "Ready", icon: "🔔", cls: "bg-green-bg text-green-mid" },
    BILLED: { label: "Billed", icon: "🧾", cls: "bg-blue-bg text-blue" },
    SETTLED: { label: "Settled", icon: "✅", cls: "bg-surface2 text-text3" },
  };

  function getDateRange(filter: string): { from: string; to: string } {
    const now = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const todayStr = fmt(now);

    if (filter === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: fmt(y), to: fmt(y) };
    }
    if (filter === "7days") {
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      const e = new Date(now);
      e.setDate(e.getDate() - 1);
      return { from: fmt(s), to: fmt(e) };
    }
    if (filter === "30days") {
      const s = new Date(now);
      s.setDate(s.getDate() - 30);
      const e = new Date(now);
      e.setDate(e.getDate() - 1);
      return { from: fmt(s), to: fmt(e) };
    }
    if (filter === "custom") {
      return { from: customFrom, to: customTo };
    }
    // "today"
    return { from: todayStr, to: todayStr };
  }

  function fetchStaffOrders(staffId: string, filter: string) {
    setStaffOrders([]);
    setExpandedStatus(null);
    setLoadingOrders(true);
    const { from, to } = getDateRange(filter);
    const params = new URLSearchParams({ staffId });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    apiFetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const orders = Array.isArray(data) ? data : [];
        setStaffOrders(orders);
        const first = statusGroups.find((st) => orders.some((o: ApiOrder) => o.status === st));
        setExpandedStatus(first || null);
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }

  function openStaffOrders(s: ApiStaff) {
    setSelectedStaff(s);
    setDateFilter("today");
    setCustomFrom("");
    setCustomTo("");
    fetchStaffOrders(s.id, "today");
  }

  function handleDateFilterChange(filter: string) {
    setDateFilter(filter);
    if (filter !== "custom" && selectedStaff) {
      fetchStaffOrders(selectedStaff.id, filter);
    }
  }

  const waiters = staff.filter((s) => s.role === "WAITER").length;
  const captains = staff.filter((s) => s.role === "CAPTAIN").length;

  const settledStaffOrders = staffOrders.filter((o) => o.status === "SETTLED");
  const totalOrders = settledStaffOrders.length;
  const totalRevenue = settledStaffOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const activeCount = staffOrders.filter((o) => o.status === "NEW" || o.status === "COOKING" || o.status === "READY").length;
  const billedCount = staffOrders.filter((o) => o.status === "BILLED").length;
  const settledCount = staffOrders.filter((o) => o.status === "SETTLED").length;
  const statusBreakdown = totalOrders
    ? `${activeCount} Active / ${billedCount} Billed / ${settledCount} Settled`
    : "—";

  return (
    <>
      {gate}
      <Topbar title="Staff Management" onMenuToggle={toggleSidebar} />
      {!selectedStaff && (
        <div className="flex-1 p-4 animate-fadeIn sm:p-6">
          <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[10px]">
            <div>
              <div className="text-sm font-semibold">Staff Management</div>
              <div className="mt-0.5 text-xs text-text3">{staff.length} staff · {waiters} waiters · {captains} captains</div>
            </div>
            <button onClick={() => checkSubscription("Add Staff", openAdd)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[13px] font-semibold text-white transition-all hover:bg-accent2 sm:px-[18px] sm:py-[9px]">+ Add Staff</button>
          </div>

          {loading ? (
            <div className="py-6 text-center text-sm text-text3">Loading staff...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
              {staff.map((s) => (
                <div key={s.id} className="relative rounded-xl border-[1.5px] border-border bg-surface p-4 transition-all hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,.08)]">
                  <div className="mb-1 flex cursor-pointer items-center gap-2" onClick={() => openStaffOrders(s)}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-bg text-sm">👤</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold">{s.name}</div>
                      {s.phone && <div className="truncate font-mono text-[10px] text-text3">{s.phone}</div>}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-[2px] font-mono text-[10px] font-bold ${s.role === "CAPTAIN" ? "bg-amber-bg text-amber" : "bg-green-bg text-green-mid"}`}>
                      {s.role}
                    </span>
                    {s.employeeId && <span className="rounded-[5px] bg-surface2 px-2 py-[2px] font-mono text-[10px] font-bold text-text3">{s.employeeId}</span>}
                  </div>
                  <div className="mt-[11px] flex gap-[5px]">
                    <button onClick={() => checkSubscription("Edit Staff", () => openEdit(s.id))} className="flex-1 rounded-md border border-border bg-transparent py-[5px] text-center text-[10px] font-semibold text-text2 hover:bg-surface2">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="flex-1 rounded-md border border-border bg-transparent py-[5px] text-center text-[10px] font-semibold text-red hover:border-[rgba(153,27,27,.2)] hover:bg-red-bg">Remove</button>
                    <button onClick={() => openStaffOrders(s)} className="flex items-center justify-center rounded-md border border-border bg-transparent px-2 py-[5px] text-[10px] font-semibold text-text2 hover:bg-accent-bg hover:text-accent">→</button>
                  </div>
                </div>
              ))}
              <div onClick={() => checkSubscription("Add Staff", openAdd)} className="flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-border2 bg-transparent p-4 text-text3 transition-all hover:border-accent hover:bg-accent-bg hover:text-accent">
                <div className="mb-2 text-[28px]">＋</div>
                <div className="text-xs font-bold">Add Staff</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {editModal && (
        <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO" onClick={(e) => e.target === e.currentTarget && setEditModal(false)}>
          <div className="mx-4 w-full max-w-[400px] overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">{editingId ? `Edit ${name}` : "Add New Staff"}</div>
              <button onClick={() => setEditModal(false)} className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 hover:bg-red-bg hover:text-red">✕</button>
            </div>
            <div className="p-5">
              {formError && (
                <div className="mb-4 rounded-lg border border-[rgba(239,68,68,.3)] bg-red-bg px-3 py-2 text-xs font-medium text-[#f87171]">
                  {formError}
                </div>
              )}
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Name *</label>
                <input className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent" placeholder="e.g. Rahul" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Phone</label>
                <input className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent" placeholder="e.g. 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">4-Digit PIN *</label>
                <div className="relative">
                  <input className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] pr-10 font-mono text-sm tracking-[0.3em] outline-none placeholder:text-text3 placeholder:tracking-normal focus:border-accent" type={showPin ? "text" : "password"} maxLength={4} placeholder="e.g. 1234" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                  <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-sm text-text3 transition-all hover:text-text">
                    {showPin ? "🙈" : "👁"}
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-text3">Staff uses this PIN to log in on their device</div>
              </div>
              <div>
                <label className="mb-[5px] block text-xs font-semibold text-text2">Role</label>
                <div className="flex gap-[9px]">
                  <div onClick={() => setRole("WAITER")} className={`flex-1 cursor-pointer rounded-lg border-[1.5px] p-[10px] text-center transition-all ${role === "WAITER" ? "border-accent bg-accent-bg" : "border-border"}`}>
                    <div className="mb-[3px] text-lg">🍽</div>
                    <div className="text-xs font-bold">Waiter</div>
                  </div>
                  <div onClick={() => setRole("CAPTAIN")} className={`flex-1 cursor-pointer rounded-lg border-[1.5px] p-[10px] text-center transition-all ${role === "CAPTAIN" ? "border-accent bg-accent-bg" : "border-border"}`}>
                    <div className="mb-[3px] text-lg">⭐</div>
                    <div className="text-xs font-bold">Captain</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-[14px]">
              <button onClick={() => setEditModal(false)} className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text hover:bg-surface2">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white hover:bg-accent2 disabled:opacity-50">{saving ? "Saving..." : editingId ? "Save Changes" : "Add Staff"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Orders — inline accordion (like Menu Editor) */}
      {selectedStaff && (
        <div className="px-4 pt-6 pb-6 animate-fadeIn sm:px-6">
          <div className="mb-[14px] flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSelectedStaff(null)}
              className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-border bg-surface2 text-[13px] text-text2 transition-all hover:bg-accent-bg hover:text-accent"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold">{selectedStaff.name}</div>
              <span className={`inline-flex items-center rounded-[5px] px-2 py-[2px] font-mono text-[10px] font-bold ${selectedStaff.role === "CAPTAIN" ? "bg-amber-bg text-amber" : "bg-green-bg text-green-mid"}`}>
                {selectedStaff.role}
              </span>
              {selectedStaff.employeeId && <span className="font-mono text-[10px] text-text3">{selectedStaff.employeeId}</span>}
            </div>
            <div className="ml-auto text-xs text-text3">{staffOrders.length} orders</div>
          </div>

          {/* Date filter */}
          <div className="mb-[14px] flex flex-wrap items-center gap-[7px]">
            {[
              { label: "Today", value: "today" },
              { label: "Yesterday", value: "yesterday" },
              { label: "Last 7 Days", value: "7days" },
              { label: "Last 30 Days", value: "30days" },
              { label: "Custom", value: "custom" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleDateFilterChange(tab.value)}
                className={`rounded-2xl border px-3 py-[5px] text-[11px] font-semibold transition-all ${
                  dateFilter === tab.value
                    ? "border-text bg-text text-white"
                    : "border-border bg-surface text-text2 hover:bg-surface2"
                }`}
              >
                {tab.label}
              </button>
            ))}
            {dateFilter === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="rounded-[7px] border border-border bg-surface px-2 py-1 text-xs text-text outline-none focus:border-accent"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
                <span className="text-xs text-text3">to</span>
                <input
                  type="date"
                  className="rounded-[7px] border border-border bg-surface px-2 py-1 text-xs text-text outline-none focus:border-accent"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
                <button
                  onClick={() => { if (customFrom && customTo && selectedStaff) fetchStaffOrders(selectedStaff.id, "custom"); }}
                  className="rounded-lg bg-accent px-3 py-[5px] text-[11px] font-semibold text-white hover:bg-accent2"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {!loadingOrders && (
            <div className="mb-[14px] grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text3">Total Orders</div>
                <div className="mt-1 text-[22px] font-bold leading-none tracking-[-0.02em]">{totalOrders}</div>
              </div>
              <div className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text3">Revenue</div>
                <div className="mt-1 text-[22px] font-bold leading-none tracking-[-0.02em]">₹{totalRevenue.toLocaleString("en-IN")}</div>
              </div>
              <div className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text3">Avg Order Value</div>
                <div className="mt-1 text-[22px] font-bold leading-none tracking-[-0.02em]">₹{avgOrderValue.toLocaleString("en-IN")}</div>
              </div>
              <div className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text3">Breakdown</div>
                <div className="mt-1 text-[16px] font-bold leading-none tracking-[-0.02em]">{statusBreakdown}</div>
              </div>
            </div>
          )}

          {loadingOrders ? (
            <div className="py-6 text-center text-sm text-text3">Loading orders...</div>
          ) : (
            <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
              {statusGroups.map((status) => {
                const orders = staffOrders.filter((o) => o.status === status);
                const cfg = statusConfig[status];
                const isOpen = expandedStatus === status;
                return (
                  <div key={status}>
                    <div
                      onClick={() => setExpandedStatus(isOpen ? null : status)}
                      className={`flex cursor-pointer items-center justify-between border-b border-border px-[18px] py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.10em] transition-colors ${isOpen ? "bg-accent/[0.07] text-accent" : "bg-background text-text3 hover:bg-accent/[0.04] hover:text-accent/70"}`}
                    >
                      <span>{cfg.icon} {cfg.label} <span className="ml-1 text-[9px] font-semibold normal-case tracking-normal opacity-60">({orders.length})</span></span>
                      <span className={`text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                    </div>
                    {isOpen && (orders.length === 0 ? (
                      <div className="border-b border-border px-[18px] py-4 text-center text-xs text-text3">No orders</div>
                    ) : orders.map((order) => (
                      <div key={order.id} onClick={() => setSelectedOrder(order)} className="flex cursor-pointer items-center gap-[11px] border-b border-border px-[18px] py-[10px] transition-colors last:border-b-0 hover:bg-background">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[13px] font-bold">{order.orderCode}</span>
                            <span className="text-[13px] text-text2">{order.table?.label || "—"}</span>
                          </div>
                          <div className="mt-[1px] text-[11px] text-text3">
                            {order.items.map((i) => `${i.menuItem.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}
                          </div>
                        </div>
                        <div className="min-w-[52px] text-right font-mono text-[13px] font-semibold">₹{order.total}</div>
                        <div className="min-w-[70px] text-right font-mono text-[10px] text-text3">
                          {new Date(order.placedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          <div className="mt-0.5 opacity-60">{new Date(order.placedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}</div>
                        </div>
                      </div>
                    )))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdate={(updated) => {
            setStaffOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setSelectedOrder(updated);
          }}
        />
      )}
    </>
  );
}
