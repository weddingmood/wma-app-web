"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Charge le tracker uniquement sur /invitation/[slug] (le script gere lui-meme le consentement)
export default function TrackingLoader() {
  const pathname = usePathname();
  useEffect(() => {
    const m = pathname ? pathname.match(/^\/invitation\/([^/]+)/) : null;
    if (!m || document.querySelector("script[data-wt-loader]")) return;
    const s = document.createElement("script");
    s.src = "/wt.js";
    s.defer = true;
    s.setAttribute("data-site", decodeURIComponent(m[1]).toLowerCase());
    s.setAttribute("data-wt-loader", "1");
    document.body.appendChild(s);
  }, [pathname]);
  return null;
}