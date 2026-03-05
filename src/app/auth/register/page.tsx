"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      return;
    }

    const data = await res.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    router.push("/onboarding/step1");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,.12),0_8px_20px_rgba(0,0,0,.06)] sm:p-10">
        <div className="mb-7 flex items-center gap-[9px]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-accent text-[15px]">🍽</div>
          <div className="font-serif text-lg font-bold">TableTalk</div>
        </div>
        <div className="mb-1.5 text-[22px] font-bold tracking-[-0.02em]">Create your account</div>
        <div className="mb-7 text-sm leading-[1.6] text-text2">
          Start your 14-day free trial. No credit card required.
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-border bg-surface px-[10px] py-[10px] text-sm font-medium text-text transition-all hover:bg-surface2">
          <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="Google" />
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
            <label className="mb-[5px] block text-xs font-semibold text-text2">Full Name</label>
            <input
              className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm text-text outline-none transition-colors placeholder:text-text3 focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,82,42,.1)]"
              placeholder="Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="mb-[5px] block text-xs font-semibold text-text2">Email</label>
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
            <label className="mb-[5px] block text-xs font-semibold text-text2">Password</label>
            <input
              className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-[9px] text-sm text-text outline-none transition-colors placeholder:text-text3 focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,82,42,.1)]"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="mt-1 flex w-full items-center justify-center rounded-[10px] bg-accent px-[26px] py-3 text-[15px] font-semibold text-white transition-all hover:bg-accent2"
          >
            Create account →
          </button>
        </form>

        <div className="mt-5 text-center text-[13px] text-text2">
          Already have an account?{" "}
          <Link href="/auth/login" className="cursor-pointer font-semibold text-accent">
            Sign in
          </Link>
        </div>
        <div className="mt-[14px] text-center text-[11px] leading-[1.6] text-text3">
          By creating an account you agree to our{" "}
          <a className="cursor-pointer text-accent">Terms</a> and{" "}
          <a className="cursor-pointer text-accent">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}
