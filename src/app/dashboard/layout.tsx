"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { SocketProvider, useSocket } from "@/contexts/SocketContext";
import { apiFetch } from "@/lib/api";
import { cachedFetch, TTL } from "@/lib/cache";
import { STORAGE_KEY } from "@/lib/storage-keys";
import { SOCKET_EVENT } from "@/lib/events";
import {
  SidebarToggleContext,
  SubscriptionPlanContext,
  SubscriptionStatusContext,
  TrialDaysContext,
  RestaurantContext,
  BranchesContext,
} from "./contexts";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <DashboardShell>{children}</DashboardShell>
    </SocketProvider>
  );
}

import type { RestaurantData, BranchSummary } from "./contexts";

// Isolated component for sidebar — order count updates only re-render this, not children
function SidebarWithOrderCount({
  restName,
  plan,
  subscriptionStatus,
  daysRemaining,
  sidebarOpen,
  onClose,
  branches,
  activeBranchId,
  onSwitchBranch,
  onAddBranch,
}: {
  restName: string;
  plan: string | null;
  subscriptionStatus: string | null;
  daysRemaining: number | null;
  sidebarOpen: boolean;
  onClose: () => void;
  branches: BranchSummary[];
  activeBranchId: string;
  onSwitchBranch: (id: string) => void;
  onAddBranch: () => void;
}) {
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const { socket } = useSocket();
  const orderCountRef = useRef(0);

  useEffect(() => {
    if (!socket) return;

    const activeStatuses = new Set(["NEW", "COOKING", "READY"]);

    const handleOrderUpdated = (order: { status: string }) => {
      if (!activeStatuses.has(order.status)) {
        if (orderCountRef.current > 0) {
          orderCountRef.current -= 1;
          setActiveOrderCount(orderCountRef.current);
        }
      }
    };

    const handleOrderCreated = () => {
      orderCountRef.current += 1;
      setActiveOrderCount(orderCountRef.current);
    };

    socket.on(SOCKET_EVENT.ORDER_UPDATED, handleOrderUpdated);
    socket.on(SOCKET_EVENT.ORDER_CREATED, handleOrderCreated);
    return () => {
      socket.off(SOCKET_EVENT.ORDER_UPDATED, handleOrderUpdated);
      socket.off(SOCKET_EVENT.ORDER_CREATED, handleOrderCreated);
    };
  }, [socket]);

  return (
    <Sidebar
      restName={restName}
      subscriptionPlan={plan}
      subscriptionStatus={subscriptionStatus}
      trialDaysLeft={daysRemaining}
      activeOrderCount={activeOrderCount}
      open={sidebarOpen}
      onClose={onClose}
      branches={branches}
      activeBranchId={activeBranchId}
      onSwitchBranch={onSwitchBranch}
      onAddBranch={onAddBranch}
    />
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [restName, setRestName] = useState("");
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [activeBranchId, setActiveBranchId] = useState("");
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const noSub = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY.DEMO_NO_SUB) === "true";
  const [plan, setPlan] = useState<string | null>(noSub ? null : "GROWTH");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Add branch modal state
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [addBranchName, setAddBranchName] = useState("");
  const [addBranchPhone, setAddBranchPhone] = useState("");
  const [addBranchCity, setAddBranchCity] = useState("");
  const [addBranchMode, setAddBranchMode] = useState("DINE_IN");
  const [addBranchSaving, setAddBranchSaving] = useState(false);
  const [addBranchError, setAddBranchError] = useState("");

  useEffect(() => {
    cachedFetch<RestaurantData>("restaurant", () => apiFetch("/api/restaurant"), TTL.ONE_DAY)
      .then((data) => {
        if (data?.name) {
          setRestName(data.name);
          setRestaurantData(data);
          setActiveBranchId(data.id);
        }
      });

    cachedFetch<{ plan: string; status: string; daysRemaining: number }>(
      "subscription",
      () => apiFetch("/api/billing/subscription"),
      TTL.ONE_HOUR,
    ).then((data) => {
      if (data && data.plan) setPlan(noSub ? null : data.plan);
      if (data?.status) setSubscriptionStatus(data.status);
      if (data?.daysRemaining != null) setDaysRemaining(data.daysRemaining);
    });

    // Always fetch fresh branch list (no cache — branch list changes after add/switch)
    apiFetch("/api/restaurant/all")
      .then((r) => r.json())
      .then((body) => {
        if (Array.isArray(body.data)) setBranches(body.data);
      })
      .catch(() => {});
  }, []);

  async function handleSwitchBranch(id: string) {
    if (id === activeBranchId) return;
    try {
      const res = await apiFetch("/api/restaurant/switch", {
        method: "POST",
        body: JSON.stringify({ restaurantId: id }),
      });
      const body = await res.json();
      if (res.ok && body.data?.token) {
        localStorage.setItem(STORAGE_KEY.TOKEN, body.data.token);
        // Clear cached restaurant/subscription so they reload for new branch
        localStorage.removeItem("cache_restaurant");
        localStorage.removeItem("cache_subscription");
        window.location.reload();
      }
    } catch {}
  }

  async function handleAddBranch() {
    setAddBranchError("");
    if (!addBranchName.trim() || !addBranchPhone.trim()) {
      setAddBranchError("Name and phone are required");
      return;
    }
    setAddBranchSaving(true);
    try {
      const res = await apiFetch("/api/restaurant", {
        method: "POST",
        body: JSON.stringify({
          name: addBranchName.trim(),
          phone: addBranchPhone.trim(),
          city: addBranchCity.trim(),
          serviceMode: addBranchMode,
        }),
      });
      const body = await res.json();
      if (res.ok && body.data?.token) {
        localStorage.setItem(STORAGE_KEY.TOKEN, body.data.token);
        localStorage.removeItem("cache_restaurant");
        localStorage.removeItem("cache_subscription");
        window.location.reload();
      } else {
        setAddBranchError(body.message || "Failed to create branch");
      }
    } catch {
      setAddBranchError("Failed to create branch");
    }
    setAddBranchSaving(false);
  }

  function openAddBranch() {
    if (plan !== "MULTI") {
      // Non-MULTI users: show upgrade message in the modal
      setAddBranchName("");
      setAddBranchPhone("");
      setAddBranchCity("");
      setAddBranchMode("DINE_IN");
      setAddBranchError("Upgrade to the Multi plan to add multiple branches.");
      setAddBranchOpen(true);
      return;
    }
    if (branches.length >= 5) {
      setAddBranchError("You've reached the 5-branch limit on the Multi plan.");
      setAddBranchOpen(true);
      return;
    }
    setAddBranchName("");
    setAddBranchPhone("");
    setAddBranchCity("");
    setAddBranchMode("DINE_IN");
    setAddBranchError("");
    setAddBranchOpen(true);
  }

  return (
    <div className="flex min-h-screen">
      <SidebarWithOrderCount
        restName={restName}
        plan={plan}
        subscriptionStatus={subscriptionStatus}
        daysRemaining={daysRemaining}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        branches={branches}
        activeBranchId={activeBranchId}
        onSwitchBranch={handleSwitchBranch}
        onAddBranch={openAddBranch}
      />
      <div className="flex flex-1 flex-col md:ml-[220px]">
        <SubscriptionPlanContext.Provider value={plan}>
          <SubscriptionStatusContext.Provider value={subscriptionStatus}>
            <TrialDaysContext.Provider value={daysRemaining}>
              <RestaurantContext.Provider value={restaurantData}>
                <BranchesContext.Provider value={branches}>
                  <SidebarToggleContext.Provider value={() => setSidebarOpen(true)}>
                    {children}
                  </SidebarToggleContext.Provider>
                </BranchesContext.Provider>
              </RestaurantContext.Provider>
            </TrialDaysContext.Provider>
          </SubscriptionStatusContext.Provider>
        </SubscriptionPlanContext.Provider>
      </div>

      {/* Add Branch Modal */}
      {addBranchOpen && (
        <div
          className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO"
          onClick={(e) => e.target === e.currentTarget && setAddBranchOpen(false)}
        >
          <div className="mx-4 w-full max-w-[420px] overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="text-sm font-bold">Add New Branch</div>
              <button
                onClick={() => setAddBranchOpen(false)}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 hover:bg-red-bg hover:text-red"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              {addBranchError && (
                <div className="mb-4 rounded-lg border border-[rgba(239,68,68,.3)] bg-red-bg px-3 py-2 text-xs font-medium text-[#f87171]">
                  {addBranchError}
                </div>
              )}
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Branch Name *</label>
                <input
                  className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                  placeholder="e.g. Koramangala Branch"
                  value={addBranchName}
                  onChange={(e) => setAddBranchName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">Phone (WhatsApp) *</label>
                <input
                  className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                  placeholder="e.g. 9876543210"
                  value={addBranchPhone}
                  onChange={(e) => setAddBranchPhone(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="mb-[5px] block text-xs font-semibold text-text2">City</label>
                <input
                  className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm outline-none placeholder:text-text3 focus:border-accent"
                  placeholder="e.g. Bangalore"
                  value={addBranchCity}
                  onChange={(e) => setAddBranchCity(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-[5px] block text-xs font-semibold text-text2">Service Mode</label>
                <div className="flex gap-[9px]">
                  {(["DINE_IN", "WALK_IN"] as const).map((mode) => (
                    <div
                      key={mode}
                      onClick={() => setAddBranchMode(mode)}
                      className={`flex-1 cursor-pointer rounded-lg border-[1.5px] p-[10px] text-center transition-all ${addBranchMode === mode ? "border-accent bg-accent-bg" : "border-border"}`}
                    >
                      <div className="mb-[3px] text-lg">{mode === "DINE_IN" ? "🍽" : "🥡"}</div>
                      <div className="text-xs font-bold">{mode === "DINE_IN" ? "Dine In" : "Walk In"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-[14px]">
              <button
                onClick={() => setAddBranchOpen(false)}
                className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text hover:bg-surface2"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBranch}
                disabled={addBranchSaving}
                className="rounded-lg bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-white hover:bg-accent2 disabled:opacity-50"
              >
                {addBranchSaving ? "Creating…" : "Create Branch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
