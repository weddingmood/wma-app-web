"use client";

import { useEffect } from "react";

export default function AmbassadorClickTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = "wm_amb_click_" + slug;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // stockage indisponible : on compte quand meme
    }
    fetch("/api/ambassadors/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => {});
  }, [slug]);

  return null;
}