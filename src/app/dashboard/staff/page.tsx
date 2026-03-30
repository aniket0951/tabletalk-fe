"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/dashboard/Topbar";
import OrderDrawer from "@/components/dashboard/OrderDrawer";
import { useToast } from "@/contexts/ToastContext";
import { useSidebarToggle } from "../contexts";
import { useSubscriptionGate } from "@/components/shared/SubscriptionGate";
import { apiFetch } from "@/lib/api";
import { GridSkeleton } from "@/components/shared/Skeleton";
import { useStaffList, invalidateStaffCache } from "@/hooks/useStaffList";
import type { ApiStaff, ApiOrderSummary, StaffRole } from "@/types";
import { RequestType } from "@/types/constants";

export default function StaffPage() {
  const toggleSidebar = useSidebarToggle();
  const { showToast } = useToast();
  const { gate, checkSubscription } = useSubscriptionGate();
  const { staffList: cachedStaff, loading: staffLoading } = useStaffList();
  const [localStaff, setLocalStaff] = useState<ApiStaff[] | null>(null);
  const staff = localStaff ?? cachedStaff;
  const setStaff = setLocalStaff;
  const loading = localStaff === null && staffLoading;
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
  type OrderStatusTab = "NEW" | "COOKING" | "READY" | "BILLED" | "SETTLED";
  const [activeTab, setActiveTab] = useState<OrderStatusTab>("NEW");
  const [tabOrders, setTabOrders] = useState<
    Partial<Record<OrderStatusTab, ApiOrderSummary[]>>
  >({});
  const [loadingTab, setLoadingTab] = useState<OrderStatusTab | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrderSummary | null>(
    null,
  );
  const [dateFilter, setDateFilter] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    setPin("");
    setRole(s.role);
    setFormError("");
    setShowPin(false);
    setEditModal(true);
  }

  async function handleSave() {
    setFormError("");
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setFormError("PIN must be exactly 4 digits");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/staff/${editingId}` : "/api/staff";
      const res = await apiFetch(url, {
        method: editingId ? RequestType.Patch : RequestType.Post,
        body: JSON.stringify({ name, phone, pin, role }),
      });
      const body = await res.json();
      if (res.ok) {
        const data = body.data;
        if (editingId) {
          setStaff((prev) =>
            (prev ?? cachedStaff).map((x) =>
              x.id === editingId ? { ...x, ...data } : x,
            ),
          );
        } else {
          setStaff((prev) => [...(prev ?? cachedStaff), data]);
        }
        invalidateStaffCache();
        showToast(editingId ? `${name} updated!` : `${name} added!`);
        setEditModal(false);
      } else {
        setFormError(body.message || "Failed to save staff");
      }
    } catch {
      setFormError("Failed to save staff");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const s = staff.find((x) => x.id === id);
    if (!s) return;
    if (!confirm(`Remove ${s.name}? Their order assignments will remain.`))
      return;
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/staff/${id}`, {
        method: RequestType.Delete,
      });
      if (res.ok) {
        setStaff((prev) => (prev ?? cachedStaff).filter((x) => x.id !== id));
        invalidateStaffCache();
        showToast(`${s.name} removed`);
      }
    } catch {
      showToast("Failed to remove staff");
    }
    setDeletingId(null);
  }

  const statusConfig: Record<
    string,
    { label: string; icon: string; cls: string }
  > = {
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

  async function fetchTabOrders(
    staffId: string,
    status: OrderStatusTab,
    filter: string,
    fromDate?: string,
    toDate?: string,
  ) {
    setLoadingTab(status);
    const { from, to } =
      filter === "custom"
        ? { from: fromDate ?? "", to: toDate ?? "" }
        : getDateRange(filter);
    const params = new URLSearchParams({ staffId, status });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const r = await apiFetch(`/api/orders?${params}`);
      const body = await r.json();
      const d = body.data;
      const orders = Array.isArray(d)
        ? d
        : Array.isArray(d?.orders)
          ? d.orders
          : [];
      setTabOrders((prev) => ({ ...prev, [status]: orders }));
    } catch {}
    setLoadingTab(null);
  }

  function handleTabSwitch(status: OrderStatusTab) {
    setActiveTab(status);
    if (tabOrders[status] === undefined && selectedStaff) {
      fetchTabOrders(selectedStaff.id, status, dateFilter, customFrom, customTo);
    }
  }

  function openStaffOrders(s: ApiStaff) {
    setSelectedStaff(s);
    setDateFilter("today");
    setCustomFrom("");
    setCustomTo("");
    setActiveTab("NEW");
    setTabOrders({});
    fetchTabOrders(s.id, "NEW", "today");
  }

  function handleDateFilterChange(filter: string) {
    setDateFilter(filter);
    if (filter !== "custom" && selectedStaff) {
      setTabOrders({});
      fetchTabOrders(selectedStaff.id, activeTab, filter);
    }
  }

  const waiters = staff.filter((s) => s.role === "WAITER").length;
  const captains = staff.filter((s) => s.role === "CAPTAIN").length;

  const settledStaffOrders = tabOrders["SETTLED"] ?? [];
  const totalOrders = settledStaffOrders.length;
  const totalRevenue = settledStaffOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = totalOrders
    ? Math.round(totalRevenue / totalOrders)
    : 0;
  const activeCount =
    (tabOrders["NEW"]?.length ?? 0) +
    (tabOrders["COOKING"]?.length ?? 0) +
    (tabOrders["READY"]?.length ?? 0);
  const billedCount = tabOrders["BILLED"]?.length ?? 0;
  const settledCount = settledStaffOrders.length;
  const totalLoadedCount = Object.values(tabOrders).reduce(
    (sum, arr) => sum + (arr?.length ?? 0),
    0,
  );
  const statusBreakdown =
    activeCount + billedCount + settledCount > 0
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
              <div className="mt-0.5 text-xs text-text3">
                {staff.length} staff · {waiters} waiters · {captains} captains
              </div>
            </div>
            <button
              onClick={() => checkSubscription("Add Staff", openAdd)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[13px] font-semibold text-white transition-all hover:bg-accent2 sm:px-[18px] sm:py-[9px]"
            >
              + Add Staff
            </button>
          </div>

          {loading ? (
            <GridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
              {staff.map((s) => (
                <div
                  key={s.id}
                  className="relative rounded-xl border-[1.5px] border-border bg-surface p-4 transition-all hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,.08)]"
                >
                  <div
                    className="mb-1 flex cursor-pointer items-center gap-2"
                    onClick={() => openStaffOrders(s)}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-bg text-sm">
                      👤
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold">
                        {s.name}
                      </div>
                      {s.phone && (
                        <div className="truncate font-mono text-[10px] text-text3">
                          {s.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-[2px] font-mono text-[10px] font-bold ${s.role === "CAPTAIN" ? "bg-amber-bg text-amber" : "bg-green-bg text-green-mid"}`}
                    >
                      {s.role}
                    </span>
                    {s.employeeId && (
                      <span className="rounded-[5px] bg-surface2 px-2 py-[2px] font-mono text-[10px] font-bold text-text3">
                        {s.employeeId}
                      </span>
                    )}
                  </div>
                  <div className="mt-[11px] flex gap-[5px]">
                    <button
                      onClick={() =>
                        checkSubscription("Edit Staff", () => openEdit(s.id))
                      }
                      className="flex-1 rounded-md border border-border bg-transparent py-[5px] text-center text-[10px] font-semibold text-text2 hover:bg-surface2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="flex-1 rounded-md border border-border bg-transparent py-[5px] text-center text-[10px] font-semibold text-red hover:border-[rgba(153,27,27,.2)] hover:bg-red-bg disabled:opacity-50"
                    >
                      {deletingId === s.id ? "Removing..." : "Remove"}
                    </button>
                    <button
                      onClick={() => openStaffOrders(s)}
                      className="flex items-center justify-center rounded-md border border-border bg-transparent px-2 py-[5px] text-[10px] font-semibold text-text2 hover:bg-accent-bg hover:text-accent"
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
              <div
                onClick={() => checkSubscription("Add Staff", openAdd)}
                className="flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-border2 bg-transparent p-4 text-text3 transition-all hover:border-accent hover:bg-accent-bg hover:text-accent"
              >
                <div className="mb-2 text-[28px]">＋</div>
                <div className="text-xs font-bold">Add Staff</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO"
          onClick={(e) => e.target === e.currentTarget && setEditModal(false)}
        >
          <div className="mx-4 w-full max-w-[400px] overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">
                {editingId ? `Edit ${name}` : "Add New Staff"}
              </div>
              <button
                onClick={() => setEditModal(false)}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 hover:bg-red-bg hover:text-red"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              {formError && (
                <div className="mb-4 rounded-lg border border-[rgba(239,68,68,.3)] bg-red-bg px-3 py-2 text-xs font-medium text-[#f87171]">
                  {formError}
                </div>
              )}
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Name *
                </label>
                <input
                  className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                  placeholder="e.g. Rahul"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Phone
                </label>
                <input
                  className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  4-Digit PIN *
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] pr-10 font-mono text-sm tracking-[0.3em] outline-none placeholder:text-text3 placeholder:tracking-normal focus:border-accent"
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    placeholder="e.g. 1234"
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-sm text-text3 transition-all hover:text-text"
                  >
                    {showPin ? "🙈" : "👁"}
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-text3">
                  Staff uses this PIN to log in on their device
                </div>
              </div>
              <div>
                <label className="mb-[5px] block text-xs font-semibold text-text2">
                  Role
                </label>
                <div className="flex gap-[9px]">
                  <div
                    onClick={() => setRole("WAITER")}
                    className={`flex-1 cursor-pointer rounded-lg border-[1.5px] p-[10px] text-center transition-all ${role === "WAITER" ? "border-accent bg-accent-bg" : "border-border"}`}
                  >
                    <div className="mb-[3px] text-lg">🍽</div>
                    <div className="text-xs font-bold">Waiter</div>
                  </div>
                  <div
                    onClick={() => setRole("CAPTAIN")}
                    className={`flex-1 cursor-pointer rounded-lg border-[1.5px] p-[10px] text-center transition-all ${role === "CAPTAIN" ? "border-accent bg-accent-bg" : "border-border"}`}
                  >
                    <div className="mb-[3px] text-lg">⭐</div>
                    <div className="text-xs font-bold">Captain</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-[14px]">
              <button
                onClick={() => setEditModal(false)}
                className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text hover:bg-surface2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white hover:bg-accent2 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Staff"}
              </button>
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
              <span
                className={`inline-flex items-center rounded-[5px] px-2 py-[2px] font-mono text-[10px] font-bold ${selectedStaff.role === "CAPTAIN" ? "bg-amber-bg text-amber" : "bg-green-bg text-green-mid"}`}
              >
                {selectedStaff.role}
              </span>
              {selectedStaff.employeeId && (
                <span className="font-mono text-[10px] text-text3">
                  {selectedStaff.employeeId}
                </span>
              )}
            </div>
            <div className="ml-auto text-xs text-text3">
              {totalLoadedCount} orders loaded
            </div>
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
                  onClick={() => {
                    if (customFrom && customTo && selectedStaff) {
                      setTabOrders({});
                      fetchTabOrders(
                        selectedStaff.id,
                        activeTab,
                        "custom",
                        customFrom,
                        customTo,
                      );
                    }
                  }}
                  className="rounded-lg bg-accent px-3 py-[5px] text-[11px] font-semibold text-white hover:bg-accent2"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {Object.keys(tabOrders).length > 0 && (
            <div className="mb-[14px] grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text3">
                  Total Orders
                </div>
                <div className="mt-1 text-[22px] font-bold leading-none tracking-[-0.02em]">
                  {totalOrders}
                </div>
              </div>
              <div className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text3">
                  Revenue
                </div>
                <div className="mt-1 text-[22px] font-bold leading-none tracking-[-0.02em]">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text3">
                  Avg Order Value
                </div>
                <div className="mt-1 text-[22px] font-bold leading-none tracking-[-0.02em]">
                  ₹{avgOrderValue.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="rounded-[10px] border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.04)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text3">
                  Breakdown
                </div>
                <div className="mt-1 text-[16px] font-bold leading-none tracking-[-0.02em]">
                  {statusBreakdown}
                </div>
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div className="mb-0 flex gap-1 overflow-x-auto pb-0">
            {(
              ["NEW", "COOKING", "READY", "BILLED", "SETTLED"] as OrderStatusTab[]
            ).map((status) => {
              const cfg = statusConfig[status];
              const isActive = activeTab === status;
              const count = tabOrders[status]?.length;
              const isLoading = loadingTab === status;
              return (
                <button
                  key={status}
                  onClick={() => handleTabSwitch(status)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-t-[8px] border border-b-0 px-3 py-[7px] text-[11px] font-semibold transition-all ${
                    isActive
                      ? "border-border bg-surface text-text shadow-[inset_0_-2px_0_0_var(--color-accent)]"
                      : "border-transparent bg-surface2/60 text-text3 hover:bg-surface2 hover:text-text2"
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                  {isLoading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent opacity-60" />
                  ) : count !== undefined ? (
                    <span
                      className={`min-w-[18px] rounded-full px-1 py-[1px] text-center font-mono text-[9px] font-bold ${isActive ? "bg-accent text-white" : "bg-border text-text3"}`}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-b-[10px] rounded-tr-[10px] border border-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,.07)]">
            {loadingTab === activeTab ? (
              <div className="py-8 text-center text-sm text-text3">
                Loading orders...
              </div>
            ) : tabOrders[activeTab] === undefined ? (
              <div className="py-8 text-center text-sm text-text3">
                Select a tab to load orders
              </div>
            ) : tabOrders[activeTab]!.length === 0 ? (
              <div className="py-8 text-center text-sm text-text3">
                No {statusConfig[activeTab].label.toLowerCase()} orders
              </div>
            ) : (
              tabOrders[activeTab]!.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="flex cursor-pointer items-center gap-[11px] border-b border-border px-[18px] py-[10px] transition-colors last:border-b-0 hover:bg-background"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-bold">
                        {order.orderCode}
                      </span>
                      <span className="text-[13px] text-text2">
                        {order.table?.label || "—"}
                      </span>
                    </div>
                    <div className="mt-[1px] text-[11px] text-text3">
                      {order._count?.items || 0} item
                      {(order._count?.items || 0) !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="min-w-[52px] text-right font-mono text-[13px] font-semibold">
                    ₹{order.total}
                  </div>
                  <div className="min-w-[70px] text-right font-mono text-[10px] text-text3">
                    {new Date(order.placedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                    <div className="mt-0.5 opacity-60">
                      {new Date(order.placedAt).toLocaleTimeString("en-IN", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}
