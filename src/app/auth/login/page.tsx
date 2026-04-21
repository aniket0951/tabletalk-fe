"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { STORAGE_KEY } from "@/lib/storage-keys";
import { ROUTES } from "@/lib/routes";
import { RequestType } from "@/types/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY.TOKEN);
    if (token) router.replace(ROUTES.DASHBOARD);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: RequestType.Post,
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      const body = await res.json();
      localStorage.setItem(STORAGE_KEY.TOKEN, body.data.token);
      localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(body.data.user));
      router.push(ROUTES.DASHBOARD);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function demoLogin(mode: "subscribed" | "noSub") {
    setDemoLoading(mode);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: RequestType.Post,
        body: JSON.stringify({
          email: "rahul@restaurant.com",
          password: "demo1234",
        }),
      });

      if (!res.ok) {
        setError("Demo login failed");
        setDemoLoading(null);
        return;
      }

      const body = await res.json();
      localStorage.setItem(STORAGE_KEY.TOKEN, body.data.token);
      localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(body.data.user));

      if (mode === "noSub") {
        localStorage.setItem(STORAGE_KEY.DEMO_NO_SUB, "true");
      } else {
        localStorage.removeItem(STORAGE_KEY.DEMO_NO_SUB);
      }

      router.push(ROUTES.DASHBOARD);
    } catch {
      setError("Demo login failed");
      setDemoLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,.12),0_8px_20px_rgba(0,0,0,.06)] sm:p-10">
        <div className="mb-7 flex items-center gap-[9px]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-accent text-[15px]">
            🍽
          </div>
          <div className="font-serif text-lg font-bold">FoodRasoi</div>
        </div>
        <div className="mb-1.5 text-[22px] font-bold tracking-[-0.02em]">
          Welcome back
        </div>
        <div className="mb-7 text-sm leading-[1.6] text-text2">
          Sign in to your restaurant dashboard.
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-border bg-surface px-[10px] py-[10px] text-sm font-medium text-text transition-all hover:bg-surface2">
          <img
            src="https://www.google.com/favicon.ico"
            width={16}
            height={16}
            alt="Google"
          />
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-text3">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-lg border border-[#fcd34d] bg-amber-bg p-[10px] text-xs text-amber">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="mb-[5px] block text-xs font-semibold text-text2">
              Email
            </label>
            <input
              className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm text-text outline-none transition-colors placeholder:text-text3 focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,82,42,.1)]"
              type="email"
              placeholder="rahul@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="mb-[5px] block text-xs font-semibold text-text2">
              Password
            </label>
            <input
              className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm text-text outline-none transition-colors placeholder:text-text3 focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,82,42,.1)]"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4 text-right">
            <a className="cursor-pointer text-xs font-semibold text-accent">
              Forgot password?
            </a>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-[10px] bg-accent px-6.5 py-3 text-[15px] font-semibold text-white transition-all hover:bg-accent2 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </form>

        <div className="mt-5 text-center text-[13px] text-text2">
          Don&apos;t have an account?{" "}
          <Link
            href={ROUTES.AUTH_REGISTER}
            className="cursor-pointer font-semibold text-accent"
          >
            Sign up free
          </Link>
        </div>

        {/* Demo shortcuts */}
        <div className="mt-4 rounded-lg border border-border bg-surface2 p-3 text-center">
          <div className="mb-1.5 text-[11px] text-text3">Demo shortcuts</div>
          <div className="flex flex-wrap justify-center gap-[7px]">
            <button
              onClick={() => demoLogin("subscribed")}
              disabled={demoLoading !== null}
              className="rounded-[7px] border border-border2 bg-transparent px-[11px] py-[5px] text-xs font-semibold text-text transition-all hover:bg-surface disabled:opacity-50"
            >
              {demoLoading === "subscribed"
                ? "Loading..."
                : "✅ With subscription"}
            </button>
            <button
              onClick={() => demoLogin("noSub")}
              disabled={demoLoading !== null}
              className="rounded-[7px] border border-border2 bg-transparent px-[11px] py-[5px] text-xs font-semibold text-text transition-all hover:bg-surface disabled:opacity-50"
            >
              {demoLoading === "noSub" ? "Loading..." : "❌ No subscription"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
