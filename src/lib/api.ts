export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  // Strip /api prefix: "/api/orders" -> "/orders"
  const cleanPath = path.startsWith("/api") ? path.slice(4) : path;

  const headers = new Headers(init?.headers);

  // Inject auth token from localStorage
  if (!headers.has("Authorization") && typeof window !== "undefined") {
    const isStaffRoute = cleanPath.startsWith("/staff/");
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

  const res = await fetch(`${API_URL}${cleanPath}`, {
    ...init,
    headers,
    // credentials: "include", // disabled temporarily for open CORS
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
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
}
