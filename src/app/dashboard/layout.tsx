"use client";

import { useCallback, useEffect, useState } from "react";
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

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [restName, setRestName] = useState("");
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [plan, setPlan] = useState<string | null>("GROWTH");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { socket } = useSocket();

  const fetchActiveOrderCount = useCallback(() => {
    apiFetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setActiveOrderCount(data.filter((o: { status: string }) => ["NEW", "COOKING", "READY"].includes(o.status)).length);
        }
      })
      .catch(() => {});
  }, []);

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

    fetchActiveOrderCount();

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
  }, [fetchActiveOrderCount]);

  useEffect(() => {
    if (!socket) return;
    socket.on("order:updated", fetchActiveOrderCount);
    return () => { socket.off("order:updated", fetchActiveOrderCount); };
  }, [socket, fetchActiveOrderCount]);

  return (
    <div className="flex min-h-screen">
      <Sidebar restName={restName} subscriptionPlan={plan} subscriptionStatus={subscriptionStatus} trialDaysLeft={daysRemaining} activeOrderCount={activeOrderCount} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
