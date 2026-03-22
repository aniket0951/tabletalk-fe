"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEY } from "@/lib/storage-keys";
import { ROUTES } from "@/lib/routes";

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY.TOKEN);
    if (token) router.replace(ROUTES.DASHBOARD);
  }, [router]);

  return null;
}
