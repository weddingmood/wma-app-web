"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function send(payload: Record<string, unknown>) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

function disabled(): boolean {
  try { return localStorage.getItem("wm_notrack") === "1"; } catch { return false; }
}

function source(): string {
  try {
    const q = new URLSearchParams(window.location.search);
    const utm = q.get("utm_source") || q.get("src");
    if (utm) return "utm:" + utm.slice(0, 40);
  } catch {}
  return document.referrer || "";
}

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("notrack");
      if (q === "1") localStorage.setItem("wm_notrack", "1");
      if (q === "0") localStorage.removeItem("wm_notrack");
    } catch {}
  }, []);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/wma-admin-2026-secure") || disabled()) return;
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

    const ref = source();
    let human = false;
    try { human = sessionStorage.getItem("wm_human") === "1"; } catch {}
    if (human) {
      send({ path: pathname, sid, ref });
      return;
    }

    const events = ["pointerdown", "touchstart", "keydown", "scroll", "wheel"];
    const onAct = () => {
      events.forEach((e) => window.removeEventListener(e, onAct));
      try { sessionStorage.setItem("wm_human", "1"); } catch {}
      send({ path: pathname, sid, ref });
    };
    events.forEach((e) => window.addEventListener(e, onAct, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onAct));
  }, [pathname]);

  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      try {
        if (disabled() || window.location.pathname.startsWith("/wma-admin-2026-secure")) return;
        const target = ev.target as Element | null;
        const el = target && target.closest ? (target.closest("[data-track], a") as HTMLElement | null) : null;
        if (!el) return;
        let name = el.getAttribute("data-track") || "";
        const href = el.getAttribute("href") || "";
        if (!name && href.indexOf("pay.wave.com") >= 0) name = "click_wave";
        if (!name && href.indexOf("wa.me/") >= 0) name = "click_whatsapp";
        if (!name) return;
        const sid = sessionStorage.getItem("wm_sid") || "";
        if (!sid) return;
        send({ path: "event:" + name.replace(/[^a-z0-9_]/gi, "").slice(0, 40), sid, ref: window.location.pathname });
      } catch {}
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}