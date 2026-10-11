"use client";

import { useEffect, useState } from "react";

type Totals = { visits: number; views: number };
type Funnel = { visitors: number; home: number; pricing: number; waveClick: number; confirmPage: number; whatsappClick: number; promoClick: number; signups: number | null; payments: number | null };
type Data = {
  today: Totals; week: Totals; period: Totals; funnel: Funnel;
  byCountry: Array<{ country: string; visits: number; views: number }>;
  byRegion: Array<{ country: string; region: string; city: string | null; visits: number }>;
  topCities: Array<{ city: string; country: string | null; visits: number }>;
  topPages: Array<{ path: string; views: number }>;
  daily: Array<{ day: string; visits: number }>;
  bySource: Array<{ source: string; visits: number }>;
};

function countryName(code: string | null): string {
  if (!code || code === "??") return "Inconnu";
  try {
    return new Intl.DisplayNames(["fr"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

function sourceLabel(s: string): string {
  if (s === "direct") return "Acc\u00e8s direct";
  if (s.startsWith("utm:")) return "Lien suivi : " + s.slice(4);
  return s.replace(/^www\./, "");
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
  const f = data.funnel;
  const steps: Array<[string, number | null, boolean]> = [
    ["Visiteurs actifs", f.visitors, false],
    ["Ont vu la page d'accueil", f.home, false],
    ["Ont ouvert la page abonnement", f.pricing, false],
    ["Ont cliqu\u00e9 sur le paiement Wave", f.waveClick, false],
    ["Ont ouvert la confirmation de paiement", f.confirmPage, false],
    ["Inscriptions (couples cr\u00e9\u00e9s)", f.signups, true],
    ["Paiements d\u00e9clar\u00e9s", f.payments, true],
  ];
  const base = Math.max(1, f.visitors);

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
          {"Aucune visite enregistr\u00e9e pour l'instant. Une visite est compt\u00e9e quand la personne touche ou fait d\u00e9filer la page : ouvrez le site depuis un autre appareil, touchez l'\u00e9cran, puis rechargez cette page."}
        </div>
      )}

      <div className={card}>
        <div className="font-bold mb-3">{"Entonnoir : o\u00f9 s'arr\u00eatent les visiteurs"}</div>
        <div className="space-y-2">
          {steps.map(([label, value, fromDb]) => {
            const pct = value === null ? 0 : Math.min(100, Math.round((value / base) * 100));
            return (
              <div key={label}>
                <div className="flex justify-between gap-3">
                  <span>{label + (fromDb ? " (base de donn\u00e9es)" : "")}</span>
                  <span className="font-bold">{value === null ? "-" : value}{value !== null && !fromDb && f.visitors > 0 ? " (" + pct + " %)" : ""}</span>
                </div>
                <div className="h-2 rounded bg-stone-100"><div className="h-2 rounded bg-[#800020]" style={{ width: pct + "%" }} /></div>
              </div>
            );
          })}
        </div>
        <p className="text-stone-500 mt-3">{"Clics WhatsApp : " + f.whatsappClick + " - Clics sur le bandeau des invitations : " + f.promoClick}</p>
      </div>

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
          <div className="font-bold mb-2">{"D'o\u00f9 viennent les visiteurs"}</div>
          <table className="w-full"><thead><tr><th className={th}>{"Source"}</th><th className={th}>{"Visites"}</th></tr></thead>
            <tbody>{data.bySource.map((r) => (<tr key={r.source}><td className={td}>{sourceLabel(r.source)}</td><td className={td}>{r.visits}</td></tr>))}</tbody>
          </table>
        </div>

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

      <p className="text-stone-500">
        {"Une visite est compt\u00e9e uniquement si la personne touche, clique ou fait d\u00e9filer la page. Pour ne pas compter vos propres appareils, ouvrez une fois ce lien sur chacun : /?notrack=1 (et /?notrack=0 pour r\u00e9activer)."}
      </p>
    </div>
  );
}