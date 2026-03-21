// Backend URL — only used server-side (in API proxy route)
// Socket.io still needs the public URL for direct WebSocket connection
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3004";

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  // Ensure path starts with /api for the Next.js proxy
  const apiPath = path.startsWith("/api") ? path : `/api${path}`;

  const headers = new Headers(init?.headers);

  // Inject auth token from localStorage
  if (!headers.has("Authorization") && typeof window !== "undefined") {
    const isStaffRoute = apiPath.startsWith("/api/staff/auth") || apiPath.startsWith("/api/staff/orders");
    if (isStaffRoute) {
      const staffData = localStorage.getItem("staff");
      if (staffData) {
        try {
          const { token } = JSON.parse(staffData);
          if (token) headers.set("Authorization", `Bearer ${token}`);
        } catch {}
      }
    } else {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Ensure Content-Type for JSON bodies
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
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
      localStorage.removeItem("staff");
      window.location.href = "/staff/login";
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    }
  }

  return res;
}

export async function publicFetch(path: string, init?: RequestInit): Promise<Response> {
  // /public/menu/123 -> /api/public/menu/123 (goes through Next.js proxy)
  const apiPath = `/api${path}`;

  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(apiPath, {
    ...init,
    headers,
  });
}
