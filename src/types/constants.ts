export const RequestType = {
  Post: "POST",
  Patch: "PATCH",
  Get: "GET",
  Delete: "DELETE",
  Head: "HEAD",
} as const;

export const TableStatus = {
  Occupid: "OCCUPIED",
  Free: "FREE",
} as const;

export const OrderTrackStatus = {
  PlacedAt: "placedAt",
  ConfirmedAt: "confirmedAt",
  CookingAt: "cookingAt",
  ReadyAt: "readyAt",
  BilledAt: "billedAt",
  SettledAt: "settledAt",
} as const;

export const PlanName = {
  Starter: "Starter",
  Growth: "Growth",
  Multi: "Multi",
} as const;

export const SubscriptionStatus = {
  Active: "ACTIVE",
  Trial: "TRIAL",
  Expired: "EXPIRED",
  Cancelled: "CANCELLED",
} as const;

export const ServiceModes = {
  DineIn: "DINE_IN",
  WalkIn: "Walk-In",
} as const;

export const OrderStatus = {
  All: "ALL",
  New: "NEW",
  Cooking: "COOKING",
  Ready: "READY",
  Billed: "BILLED",
  Settled: "SETTLED",
  BillSent: "BILL SENT",
} as const;

export const Headers = {
  Authorization: "Authorization",
  ContentType: "Content-Type",
} as const;
