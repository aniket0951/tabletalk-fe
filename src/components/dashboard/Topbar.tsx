"use client";

import { useRouter } from "next/navigation";
import { useSocket } from "@/contexts/SocketContext";
import { useSubscriptionStatus, useTrialDays } from "@/app/dashboard/layout";

interface TopbarProps {
  title: string;
  onAddItem?: () => void;
  onMenuToggle: () => void;
  loading?: boolean;
}

export default function Topbar({ title, onAddItem, onMenuToggle, loading }: TopbarProps) {
  const { isConnected } = useSocket();
  const subscriptionStatus = useSubscriptionStatus();
  const trialDaysLeft = useTrialDays();
  const router = useRouter();

  function handleLogout() {
    localStorage.clear();
    router.push("/auth/login");
  }

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-surface">
    <div className="flex h-[54px] items-center justify-between px-4 sm:px-[26px]">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-lg md:hidden">
          ☰
        </button>
        <div className="text-[15px] font-semibold">{title}</div>
      </div>
      <div className="flex items-center gap-2 sm:gap-[10px]">
        <div className={`hidden items-center gap-[5px] font-mono text-[10px] font-semibold sm:inline-flex ${isConnected ? "text-green-mid" : "text-red"}`}>
          <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? "animate-blink bg-green-mid" : "bg-red"}`} />
          {isConnected ? "LIVE" : "OFFLINE"}
        </div>
        {subscriptionStatus === "TRIAL" && trialDaysLeft != null && (
          <div className={`hidden items-center gap-[5px] rounded-[5px] px-[7px] py-[2px] font-mono text-[10px] font-bold tracking-[0.04em] sm:inline-flex ${trialDaysLeft <= 3 ? "bg-[rgba(251,191,36,.15)] text-[#fbbf24]" : "bg-[rgba(251,146,60,.12)] text-[#fb923c]"}`}>
            TRIAL · {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
          </div>
        )}
        <span className="hidden font-mono text-[11px] text-text3 md:inline">26 Feb 2026</span>
        {onAddItem && (
          <button onClick={onAddItem} className="rounded-[7px] border border-border2 bg-transparent px-[11px] py-[5px] text-xs font-semibold text-text transition-all hover:bg-surface2">
            + Add Item
          </button>
        )}
        <button onClick={handleLogout} className="rounded-[7px] border border-border2 bg-transparent px-[11px] py-[5px] text-xs font-semibold text-text transition-all hover:bg-surface2 hover:text-red">
          ⏻ Logout
        </button>
      </div>
    </div>
    {loading && (
      <div className="h-[2px] w-full overflow-hidden bg-border">
        <div className="h-full w-1/3 bg-accent" style={{ animation: "loading 1s ease-in-out infinite" }} />
      </div>
    )}
    </div>
  );
}
