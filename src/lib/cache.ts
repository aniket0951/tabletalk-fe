import { cacheKey } from "./storage-keys";

// Simple TTL cache using localStorage
// Usage: const data = await cachedFetch("subscription", () => apiFetch("/api/billing/subscription"), 24 * 60 * 60 * 1000);

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export function getCached<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(key));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiry) {
      localStorage.removeItem(cacheKey(key));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { data, expiry: Date.now() + ttlMs };
    localStorage.setItem(cacheKey(key), JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable
  }
}

export function clearCache(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(cacheKey(key));
}

// TTL constants
export const TTL = {
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  FIVE_MIN: 5 * 60 * 1000,
} as const;

// Fetch with cache — returns cached data if available, otherwise fetches and caches
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<Response>,
  ttlMs: number,
): Promise<T | null> {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;

  try {
    const res = await fetcher();
    if (!res.ok) return null;
    const json = await res.json();
    const data = json.data !== undefined ? json.data : json;
    setCache(key, data, ttlMs);
    return data;
  } catch {
    return null;
  }
}
