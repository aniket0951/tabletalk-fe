"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-100 border-b border-border bg-[rgba(250,248,244,.92)] backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 md:px-12 md:py-4.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-base">
            🍽
          </div>
          <div className="font-serif text-xl font-bold tracking-[-0.02em]">
            TableTalk
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-7 md:flex">
          <a className="cursor-pointer text-sm text-text2 transition-colors hover:text-text">
            Features
          </a>
          <a className="cursor-pointer text-sm text-text2 transition-colors hover:text-text">
            Pricing
          </a>
          <a className="cursor-pointer text-sm text-text2 transition-colors hover:text-text">
            How it works
          </a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden gap-2 md:flex">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text transition-all hover:bg-surface2"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4.5 py-2.25 text-[13px] font-semibold text-white transition-all hover:bg-accent2"
          >
            Start Free →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border md:hidden"
        >
          <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border px-4 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-3">
            <a className="cursor-pointer text-sm text-text2">Features</a>
            <a className="cursor-pointer text-sm text-text2">Pricing</a>
            <a className="cursor-pointer text-sm text-text2">How it works</a>
          </div>
          <div className="mt-4 flex gap-2">
            <Link
              href="/auth/login"
              className="flex flex-1 items-center justify-center rounded-lg border-[1.5px] border-border2 bg-transparent py-2.25 text-[13px] font-semibold text-text"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="flex flex-1 items-center justify-center rounded-lg bg-accent py-2.25 text-[13px] font-semibold text-white"
            >
              Start Free →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
