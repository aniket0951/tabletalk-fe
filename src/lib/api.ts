const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  // Strip /api prefix: "/api/orders" -> "/orders"
  const cleanPath = path.startsWith("/api") ? path.slice(4) : path;

  const headers = new Headers(init?.headers);

  // Inject owner auth token from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure Content-Type for JSON bodies
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${cleanPath}`, {
    ...init,
    headers,
    credentials: "include", // for staff cookies
  });

  // Redirect to login on 401
  if (res.status === 401 && typeof window !== "undefined") {
    const isStaffPath = window.location.pathname.startsWith("/staff");
    if (!isStaffPath) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    }
  }

  return res;
}
