"use client";

import { createContext, useContext } from "react";

export interface RestaurantData {
  id: string;
  name: string;
  phone: string;
  city: string;
  upiId: string;
  serviceMode: string;
  restaurantCode: string | null;
}

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

export interface BranchSummary {
  id: string;
  name: string;
  city: string;
  serviceMode: string;
}

export const BranchesContext = createContext<BranchSummary[]>([]);
export function useBranches() { return useContext(BranchesContext); }
