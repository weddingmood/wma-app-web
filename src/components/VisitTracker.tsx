"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/wma-admin-2026-secure")) return;
    let sid = "";
    try {
      sid = sessionStorage.getItem("wm_sid") || "";
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("wm_sid", sid);
      }
    } catch {
      return;
    }
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, sid, ref: document.referrer || "" }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);
  return null;
}