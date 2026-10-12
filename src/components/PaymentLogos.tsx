"use client";
import { useEffect, useState } from "react";
type Item = { name: string; logo: string; soon: boolean };
const DEFAULTS: Item[] = [
  { name: "Wave", logo: "", soon: false },
  { name: "Orange Money", logo: "", soon: false },
  { name: "MTN Money", logo: "", soon: false },
  { name: "Moov Money", logo: "", soon: false },
];
export default function PaymentLogos({ title = "Moyens de paiement" }: { title?: string }) {
  const [items, setItems] = useState<Item[]>(DEFAULTS);
  useEffect(() => {
    fetch("/api/public-settings", { cache: "no-store" })
     .then((r) => r.json())
     .then((d) => {
        try {
          const arr = JSON.parse((d && d.values && d.values.payment_methods) || "[]");
          if (Array.isArray(arr) && arr.length > 0) {
            setItems(arr.filter((x: any) => x && x.name).map((x: any) => ({ name: String(x.name), logo: String(x.logo || ""), soon: false })));
          }
        } catch {}
      }).catch(() => {});
  }, []);
  return (
    <div className="text-center space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{title}</p>
      <div className="flex flex-wrap items-start justify-center gap-4">
        {items.map((p, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            {p.logo? (<img src={p.logo} alt={p.name} title={p.name} className="h-8 w-auto object-contain" />) : (<span className="px-3 py-1 rounded-lg text-xs font-semibold text-stone-700 border border-stone-300">{p.name}</span>)}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-stone-500">Paiement 100% sécurisé via Paiement Pro / XPaye & Wave</p>
    </div>
  );
}
