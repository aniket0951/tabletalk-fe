// Static routes
export const ROUTES = {
  DASHBOARD: "/dashboard",
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  STAFF_LOGIN: "/staff/login",
  STAFF_ORDERS: "/staff/orders",
  ONBOARDING_STEP1: "/onboarding/step1",
  ONBOARDING_STEP2: "/onboarding/step2",
  OFFERS: "/dashboard/offers",
  CAMPAIGNS: "/dashboard/campaigns",
  CAMPAIGNS_HISTORY: "/dashboard/campaigns/history",
} as const;

// Dynamic routes
export const orderRoute = (tableId: string) => `/order/${tableId}`;
export const orderCartRoute = (tableId: string) => `/order/${tableId}/cart`;
export const orderStatusRoute = (tableId: string, orderId: string) =>
  `/order/${tableId}/status/${orderId}`;
