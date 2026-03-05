"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { SocketProvider } from "@/contexts/SocketContext";
import { apiFetch } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [restName, setRestName] = useState("");
  const [plan, setPlan] = useState<string | null>("GROWTH");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const noSub = localStorage.getItem("demo_no_sub");
    if (noSub === "true") setPlan(null);

    apiFetch("/api/restaurant")
      .then((r) => r.json())
      .then((data) => { if (data?.name) setRestName(data.name); })
      .catch(() => {});

    apiFetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setActiveOrderCount(data.filter((o: { status: string }) => ["NEW", "COOKING", "READY"].includes(o.status)).length);
        }
      })
      .catch(() => {});

    apiFetch("/api/billing/subscription")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.plan) setPlan(noSub === "true" ? null : data.plan);
        if (data?.status) setSubscriptionStatus(data.status);
        if (data?.daysRemaining != null) setDaysRemaining(data.daysRemaining);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar restName={restName} subscriptionPlan={plan} subscriptionStatus={subscriptionStatus} trialDaysLeft={daysRemaining} activeOrderCount={activeOrderCount} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col md:ml-[220px]">
        {/* Children receive onMenuToggle via cloneElement workaround —
            instead we use a context-like approach by wrapping */}
        <SocketProvider>
          <SubscriptionPlanContext.Provider value={plan}>
            <SubscriptionStatusContext.Provider value={subscriptionStatus}>
              <TrialDaysContext.Provider value={daysRemaining}>
                <SidebarToggleContext.Provider value={() => setSidebarOpen(true)}>
                  {children}
                </SidebarToggleContext.Provider>
              </TrialDaysContext.Provider>
            </SubscriptionStatusContext.Provider>
          </SubscriptionPlanContext.Provider>
        </SocketProvider>
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
