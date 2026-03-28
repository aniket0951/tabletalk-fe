import { STORAGE_KEY } from "./storage-keys";
import { ROUTES } from "./routes";
import { Headers as HeadersConst } from "@/types/constants";

// Backend URL — only used server-side (in API proxy route)
// Socket.io still needs the public URL for direct WebSocket connection
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3004";

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  // Ensure path starts with /api for the Next.js proxy
  const apiPath = path.startsWith("/api") ? path : `/api${path}`;

  const headers = new Headers(init?.headers);

  // Inject auth token from localStorage
  if (
    !headers.has(HeadersConst.Authorization) &&
    typeof window !== "undefined"
  ) {
    const isStaffRoute =
      apiPath.startsWith("/api/staff/auth") ||
      apiPath.startsWith("/api/staff/orders");
    if (isStaffRoute) {
      const staffData = localStorage.getItem(STORAGE_KEY.STAFF);
      if (staffData) {
        try {
          const { token } = JSON.parse(staffData);
          if (token) headers.set(HeadersConst.Authorization, `Bearer ${token}`);
        } catch {}
      }
    } else {
      const token = localStorage.getItem(STORAGE_KEY.TOKEN);
      if (token) headers.set(HeadersConst.Authorization, `Bearer ${token}`);
    }
  }

  // Ensure Content-Type for JSON bodies
  if (init?.body && !headers.has(HeadersConst.ContentType)) {
    headers.set(HeadersConst.ContentType, "application/json");
  }

  // Call same-origin Next.js proxy — backend URL is hidden
  const res = await fetch(apiPath, {
    ...init,
    headers,
  });

  // Redirect to login on 401
  if (res.status === 401 && typeof window !== "undefined") {
    const isStaffPath = window.location.pathname.startsWith("/staff");
    if (isStaffPath) {
      localStorage.removeItem(STORAGE_KEY.STAFF);
      window.location.href = ROUTES.STAFF_LOGIN;
    } else {
      localStorage.removeItem(STORAGE_KEY.TOKEN);
      localStorage.removeItem(STORAGE_KEY.USER);
      window.location.href = ROUTES.AUTH_LOGIN;
    }
  }

  return res;
}

export async function publicFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  // /public/menu/123 -> /api/public/menu/123 (goes through Next.js proxy)
  const apiPath = `/api${path}`;

  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has(HeadersConst.ContentType)) {
    headers.set(HeadersConst.ContentType, "application/json");
  }

  return fetch(apiPath, {
    ...init,
    headers,
  });
}

// ── Typed API response helpers ──────────────────────────────

export interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T;
  debug_message?: string;
  code?: string;
}

export class ApiError extends Error {
  statusCode: number;
  debugMessage?: string;
  code?: string;

  constructor(res: ApiResponse<null>) {
    super(res.message);
    this.name = "ApiError";
    this.statusCode = res.status_code;
    this.debugMessage = res.debug_message;
    this.code = res.code;
  }
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const body: ApiResponse<T> = await res.json();
  if (body.status_code !== 200) {
    throw new ApiError(body as ApiResponse<null>);
  }
  return body;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await apiFetch(path, init);
  return parseResponse<T>(res);
}

export async function publicRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await publicFetch(path, init);
  return parseResponse<T>(res);
}
