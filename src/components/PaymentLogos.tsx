"use client";

import { useEffect, useState } from "react";

export default function PaymentLogos({ title = "Moyens de paiement" }: { title?: string }) {
  const [items, setItems] = useState<Array<{ name: string; logo: string }>>([]);

  useEffect(() => {
    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        try {
          const arr = JSON.parse((d && d.values && d.values.payment_methods) || "[]");
          if (Array.isArray(arr)) setItems(arr.filter((x: any) => x && x.name));
        } catch {}
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="text-center space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{title}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {items.map((p, i) =>
          p.logo ? (
            <img key={i} src={p.logo} alt={p.name} title={p.name} className="h-8 w-auto object-contain" />
          ) : (
            <span key={i} className="px-3 py-1 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700">{p.name}</span>
          )
        )}
      </div>
    </div>
  );
}