"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { ApiStaff } from "@/types";

let cachedStaff: ApiStaff[] | null = null;
let fetchPromise: Promise<ApiStaff[]> | null = null;

function fetchStaff(): Promise<ApiStaff[]> {
  if (cachedStaff) return Promise.resolve(cachedStaff);
  if (fetchPromise) return fetchPromise;

  fetchPromise = apiFetch("/api/staff")
    .then((r) => r.json())
    .then((body) => {
      const list = Array.isArray(body.data) ? body.data : [];
      cachedStaff = list;
      fetchPromise = null;
      return list;
    })
    .catch(() => {
      fetchPromise = null;
      return [];
    });

  return fetchPromise;
}

export function invalidateStaffCache() {
  cachedStaff = null;
  fetchPromise = null;
}

export function useStaffList() {
  const [staffList, setStaffList] = useState<ApiStaff[]>(cachedStaff ?? []);
  const [loading, setLoading] = useState(!cachedStaff);

  useEffect(() => {
    fetchStaff().then((list) => {
      setStaffList(list);
      setLoading(false);
    });
  }, []);

  return { staffList, loading, refresh };

  function refresh() {
    invalidateStaffCache();
    setLoading(true);
    fetchStaff().then((list) => {
      setStaffList(list);
      setLoading(false);
    });
  }
}
