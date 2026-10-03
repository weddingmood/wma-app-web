"use client";

import { useEffect, useState } from "react";

export function useHiddenGames(): string[] {
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/games/visibility", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d.hidden)) setHidden(d.hidden);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return hidden;
}