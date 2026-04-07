"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { useSocket } from "@/contexts/SocketContext";
import { useSubscriptionStatus, useTrialDays, useRestaurant, useBranches, useSubscriptionPlan } from "@/app/dashboard/contexts";
import { useBranchSwitch } from "@/hooks/useBranchSwitch";

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
  const plan = useSubscriptionPlan();
  const restaurant = useRestaurant();
  const branches = useBranches();
  const { switchBranch, switching } = useBranchSwitch();
  const router = useRouter();
  const [branchOpen, setBranchOpen] = useState(false);

  function handleLogout() {
    localStorage.clear();
    router.push("/");
  }

  const showSwitcher = plan === "MULTI" && branches.length > 1;

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
          {subscriptionStatus === "ACTIVE" && trialDaysLeft != null && (
            <div className={`hidden items-center gap-[5px] rounded-[5px] px-[7px] py-[2px] font-mono text-[10px] font-bold tracking-[0.04em] sm:inline-flex ${trialDaysLeft <= 7 ? "bg-[rgba(251,191,36,.15)] text-[#fbbf24]" : "bg-[rgba(34,197,94,.12)] text-[#4ade80]"}`}>
              ACTIVE · {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
            </div>
          )}

          {/* Branch switcher — only when user has multiple branches */}
          {showSwitcher && (
            <div className="relative">
              {branchOpen && (
                <div className="fixed inset-0 z-[49]" onClick={() => setBranchOpen(false)} />
              )}
              <button
                onClick={() => setBranchOpen((v) => !v)}
                className="hidden items-center gap-[6px] rounded-[7px] border border-border bg-surface2 px-[10px] py-[5px] text-xs font-semibold text-text transition-all hover:bg-border sm:flex"
              >
                <span className="text-[11px]">🏠</span>
                <span className="max-w-[100px] truncate">{restaurant?.name ?? "Branch"}</span>
                <span className={`font-mono text-[10px] text-text3 transition-transform ${branchOpen ? "rotate-180" : ""}`}>▾</span>
              </button>

              {branchOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-[200px] overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_8px_30px_rgba(0,0,0,.12)] animate-slideUp">
                  <div className="px-3 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-text3">Switch Branch</div>
                  {branches.map((b) => {
                    const isActive = b.id === restaurant?.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => { setBranchOpen(false); if (!isActive) switchBranch(b.id); }}
                        disabled={switching === b.id}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-all hover:bg-surface2 disabled:opacity-50 ${isActive ? "text-text" : "text-text2"}`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? "bg-accent" : "bg-border2"}`} />
                        <span className="min-w-0 flex-1 truncate font-medium">{b.branchAlias || b.name}</span>
                        {b.city && <span className="shrink-0 font-mono text-[10px] text-text3">{b.city}</span>}
                        {switching === b.id && <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-[1.5px] border-accent border-t-transparent" />}
                        {isActive && !switching && <span className="shrink-0 font-mono text-[9px] text-accent">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
