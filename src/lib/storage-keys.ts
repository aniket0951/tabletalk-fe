// localStorage keys
export const STORAGE_KEY = {
  STAFF: "staff",
  TOKEN: "token",
  USER: "user",
  DEMO_NO_SUB: "demo_no_sub",
} as const;

// Dynamic localStorage keys
export const ratedKey = (orderId: string) => `rated_${orderId}`;
export const cacheKey = (key: string) => `cache_${key}`;

// sessionStorage keys
export const cartKey = (tableId: string) => `cart_${tableId}`;
