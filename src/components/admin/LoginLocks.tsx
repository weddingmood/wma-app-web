"use client";

import { useEffect, useState } from "react";

type Lock = { key: string; fails: number; locked: boolean; minutes: number };

function label(key: string): string {
  if (key.startsWith("couple:")) return "Couple : " + key.slice(7);
  if (key.startsWith("admin:")) return "Administrateur : " + key.slice(6);
  if (key.startsWith("adminpw:")) return "Changement de mot de passe admin n\u00b0" + key.slice(8);
  return key;
}

export default function LoginLocks() {
  const [locks, setLocks] = useState<Lock[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(true);

  const load = async () => {
    try {
      const r = await fetch("/api/admin/locks", { cache: "no-store" });
      const d = await r.json();
      if (d && d.success) setLocks(d.locks || []);
      else { setOk(false); setMsg((d && d.message) || "Chargement impossible."); }
    } catch {
      setOk(false);
      setMsg("Connexion indisponible.");
    }
  };
  useEffect(() => { void load(); }, []);

  const unlock = async (key: string) => {
    setMsg(null);
    try {
      const r = await fetch("/api/admin/locks?key=" + encodeURIComponent(key), { method: "DELETE" });
      const d = await r.json().catch(() => null);
      if (r.ok && d && d.success) { setOk(true); setMsg("D\u00e9bloqu\u00e9 \u2714"); await load(); }
      else { setOk(false); setMsg((d && d.message) || "Action impossible."); }
    } catch {
      setOk(false);
      setMsg("Connexion indisponible.");
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3 text-xs">
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <h3 className="font-serif font-bold text-stone-900 text-base">{"Blocages de connexion"}</h3>
        <button type="button" onClick={load} className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-bold cursor-pointer">{"Actualiser"}</button>
      </div>
      {msg && (
        <div className={"p-3 rounded-xl border font-semibold " + (ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800")}>{msg}</div>
      )}
      {locks.length === 0 && <p className="text-stone-500">{"Aucun blocage ni \u00e9chec r\u00e9cent."}</p>}
      {locks.map((l) => (
        <div key={l.key} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl border border-stone-200 bg-stone-50">
          <div>
            <strong>{label(l.key)}</strong>
            <div className="text-stone-500">{l.fails + " \u00e9chec(s)" + (l.locked ? " - bloqu\u00e9 encore " + l.minutes + " min" : " - pas bloqu\u00e9")}</div>
          </div>
          <button type="button" onClick={() => unlock(l.key)} className="px-3 py-1.5 rounded-lg bg-stone-900 text-white font-bold cursor-pointer">{"D\u00e9bloquer"}</button>
        </div>
      ))}
    </div>
  );
}