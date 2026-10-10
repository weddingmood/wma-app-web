"use client";

import { useEffect, useState } from "react";

type Totals = { visits: number; views: number };
type Data = {
  today: Totals; week: Totals; period: Totals;
  byCountry: Array<{ country: string; visits: number; views: number }>;
  byRegion: Array<{ country: string; region: string; city: string | null; visits: number }>;
  topCities: Array<{ city: string; country: string | null; visits: number }>;
  topPages: Array<{ path: string; views: number }>;
  daily: Array<{ day: string; visits: number }>;
};

function countryName(code: string | null): string {
  if (!code || code === "??") return "Inconnu";
  try {
    return new Intl.DisplayNames(["fr"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

const card = "p-4 rounded-2xl bg-white border border-stone-200";
const th = "text-left text-[11px] uppercase tracking-wide text-stone-500 py-2";
const td = "py-2 border-t border-stone-100";

export default function VisitsPanel() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    fetch("/api/admin/visits?days=" + days, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d && d.success) setData(d); else setErr((d && d.message) || "Chargement impossible."); })
      .catch(() => setErr("Connexion indisponible."));
  }, [days]);

  if (err) return <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs">{err}</div>;
  if (!data) return <div className="p-4 text-xs text-stone-500">{"Chargement..."}</div>;

  const max = Math.max(1, ...data.daily.map((d) => d.visits));
  const empty = data.period.views === 0;

  return (
    <div className="space-y-5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif font-bold text-stone-900 text-base">{"Visites du site par pays et r\u00e9gion"}</h3>
        <div className="flex gap-2">
          {[7, 30, 90, 365].map((d) => (
            <button key={d} type="button" onClick={() => setDays(d)} className={"px-3 py-1.5 rounded-lg font-bold cursor-pointer border " + (d === days ? "bg-[#800020] text-white border-[#800020]" : "bg-white text-stone-700 border-stone-300")}>
              {d === 365 ? "1 an" : d + " jours"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={card}><div className="text-stone-500">{"Visites aujourd'hui"}</div><div className="text-2xl font-extrabold">{data.today.visits}</div></div>
        <div className={card}><div className="text-stone-500">{"Visites sur 7 jours"}</div><div className="text-2xl font-extrabold">{data.week.visits}</div></div>
        <div className={card}><div className="text-stone-500">{"Visites sur la p\u00e9riode"}</div><div className="text-2xl font-extrabold">{data.period.visits}</div></div>
        <div className={card}><div className="text-stone-500">{"Pages vues sur la p\u00e9riode"}</div><div className="text-2xl font-extrabold">{data.period.views}</div></div>
      </div>

      {empty && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
          {"Aucune visite enregistr\u00e9e pour l'instant. Le comptage a commenc\u00e9 avec cette mise en ligne : ouvrez le site depuis un autre appareil ou onglet, puis rechargez cette page."}
        </div>
      )}

      {data.daily.length > 0 && (
        <div className={card}>
          <div className="font-bold mb-3">{"Visites par jour"}</div>
          <div className="flex items-end gap-1 h-24">
            {data.daily.map((d) => (
              <div key={d.day} title={d.day + " : " + d.visits} className="flex-1 bg-[#800020] rounded-t" style={{ height: Math.max(4, (d.visits / max) * 100) + "%" }} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={card}>
          <div className="font-bold mb-2">{"Par pays"}</div>
          <table className="w-full"><thead><tr><th className={th}>{"Pays"}</th><th className={th}>{"Visites"}</th><th className={th}>{"Pages vues"}</th></tr></thead>
            <tbody>{data.byCountry.map((r) => (<tr key={r.country}><td className={td}>{countryName(r.country)}</td><td className={td}>{r.visits}</td><td className={td}>{r.views}</td></tr>))}</tbody>
          </table>
        </div>

        <div className={card}>
          <div className="font-bold mb-2">{"Par r\u00e9gion"}</div>
          <table className="w-full"><thead><tr><th className={th}>{"Pays"}</th><th className={th}>{"R\u00e9gion (code)"}</th><th className={th}>{"Ville principale"}</th><th className={th}>{"Visites"}</th></tr></thead>
            <tbody>{data.byRegion.map((r, i) => (<tr key={i}><td className={td}>{countryName(r.country)}</td><td className={td}>{r.region}</td><td className={td}>{r.city || "-"}</td><td className={td}>{r.visits}</td></tr>))}</tbody>
          </table>
        </div>

        <div className={card}>
          <div className="font-bold mb-2">{"Villes les plus actives"}</div>
          <table className="w-full"><thead><tr><th className={th}>{"Ville"}</th><th className={th}>{"Pays"}</th><th className={th}>{"Visites"}</th></tr></thead>
            <tbody>{data.topCities.map((r, i) => (<tr key={i}><td className={td}>{r.city}</td><td className={td}>{countryName(r.country)}</td><td className={td}>{r.visits}</td></tr>))}</tbody>
          </table>
        </div>

        <div className={card}>
          <div className="font-bold mb-2">{"Pages les plus vues"}</div>
          <table className="w-full"><thead><tr><th className={th}>{"Page"}</th><th className={th}>{"Vues"}</th></tr></thead>
            <tbody>{data.topPages.map((r) => (<tr key={r.path}><td className={td}>{r.path}</td><td className={td}>{r.views}</td></tr>))}</tbody>
          </table>
        </div>
      </div>

      <p className="text-stone-500">{"Une visite correspond \u00e0 une session de navigation. Les robots, les pages admin et les adresses IP ne sont pas enregistr\u00e9s."}</p>
    </div>
  );
}