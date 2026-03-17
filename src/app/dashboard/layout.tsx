"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { SocketProvider, useSocket } from "@/contexts/SocketContext";
import { apiFetch } from "@/lib/api";
import { cachedFetch, TTL } from "@/lib/cache";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <DashboardShell>{children}</DashboardShell>
    </SocketProvider>
  );
}

interface RestaurantData {
  id: string;
  name: string;
  phone: string;
  city: string;
  upiId: string;
  serviceMode: string;
  restaurantCode: string | null;
}

// Isolated component for sidebar — order count updates only re-render this, not children
function SidebarWithOrderCount({ restName, plan, subscriptionStatus, daysRemaining, sidebarOpen, onClose }: {
  restName: string;
  plan: string | null;
  subscriptionStatus: string | null;
  daysRemaining: number | null;
  sidebarOpen: boolean;
  onClose: () => void;
}) {
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const { socket } = useSocket();
  const orderCountRef = useRef(0);

  // Initial fetch — one time only
  useEffect(() => {
    apiFetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const count = data.filter((o: { status: string }) => ["NEW", "COOKING", "READY"].includes(o.status)).length;
          orderCountRef.current = count;
          setActiveOrderCount(count);
        }
      })
      .catch(() => {});
  }, []);

  // Socket updates — adjust count from event data, no API re-fetch
  useEffect(() => {
    if (!socket) return;

    const activeStatuses = new Set(["NEW", "COOKING", "READY"]);

    const handleOrderUpdated = (order: { id: string; status: string }) => {
      // Re-fetch count since we can't track transitions reliably without full state
      apiFetch("/api/orders")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const count = data.filter((o: { status: string }) => activeStatuses.has(o.status)).length;
            if (count !== orderCountRef.current) {
              orderCountRef.current = count;
              setActiveOrderCount(count);
            }
          }
        })
        .catch(() => {});
    };

    const handleOrderCreated = () => {
      orderCountRef.current += 1;
      setActiveOrderCount(orderCountRef.current);
    };

    socket.on("order:updated", handleOrderUpdated);
    socket.on("order:created", handleOrderCreated);
    return () => {
      socket.off("order:updated", handleOrderUpdated);
      socket.off("order:created", handleOrderCreated);
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
    />
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [restName, setRestName] = useState("");
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [plan, setPlan] = useState<string | null>("GROWTH");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const noSub = localStorage.getItem("demo_no_sub");
    if (noSub === "true") setPlan(null);

    // Cache restaurant data for 1 day
    cachedFetch<RestaurantData>("restaurant", () => apiFetch("/api/restaurant"), TTL.ONE_DAY)
      .then((data) => {
        if (data?.name) {
          setRestName(data.name);
          setRestaurantData(data);
        }
      });

    // Cache subscription data for 1 hour
    cachedFetch<{ plan: string; status: string; daysRemaining: number }>(
      "subscription",
      () => apiFetch("/api/billing/subscription"),
      TTL.ONE_HOUR,
    ).then((data) => {
      if (data && data.plan) setPlan(noSub === "true" ? null : data.plan);
      if (data?.status) setSubscriptionStatus(data.status);
      if (data?.daysRemaining != null) setDaysRemaining(data.daysRemaining);
    });
  }, []);

  return (
    <div className="flex min-h-screen">
      <SidebarWithOrderCount
        restName={restName}
        plan={plan}
        subscriptionStatus={subscriptionStatus}
        daysRemaining={daysRemaining}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col md:ml-[220px]">
        <SubscriptionPlanContext.Provider value={plan}>
          <SubscriptionStatusContext.Provider value={subscriptionStatus}>
            <TrialDaysContext.Provider value={daysRemaining}>
              <RestaurantContext.Provider value={restaurantData}>
                <SidebarToggleContext.Provider value={() => setSidebarOpen(true)}>
                  {children}
                </SidebarToggleContext.Provider>
              </RestaurantContext.Provider>
            </TrialDaysContext.Provider>
          </SubscriptionStatusContext.Provider>
        </SubscriptionPlanContext.Provider>
      </div>
    </div>
  );
}

import { createContext, useContext } from "react";
export const SidebarToggleContext = createContext<() => void>(() => {});
export function useSidebarToggle() { return useContext(SidebarToggleContext); }

export const SubscriptionPlanContext = createContext<string | null>("GROWTH");
export function useSubscriptionPlan() { return useContext(SubscriptionPlanContext); }

export const SubscriptionStatusContext = createContext<string | null>(null);
export function useSubscriptionStatus() { return useContext(SubscriptionStatusContext); }

export const TrialDaysContext = createContext<number | null>(null);
export function useTrialDays() { return useContext(TrialDaysContext); }

export const RestaurantContext = createContext<RestaurantData | null>(null);
export function useRestaurant() { return useContext(RestaurantContext); }
