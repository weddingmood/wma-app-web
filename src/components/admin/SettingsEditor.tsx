"use client";

import { useEffect, useState } from "react";

type Faq = { q: string; a: string };
type Field = { key: string; label: string; area?: boolean };

const inp = "w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs";
const lab = "block text-stone-700 font-bold mb-1 text-xs";

const SECTIONS: Array<{ title: string; fields: Field[] }> = [
  { title: "Contacts", fields: [
    { key: "whatsapp", label: "Num\u00e9ro WhatsApp" },
    { key: "phone", label: "T\u00e9l\u00e9phone" },
    { key: "email_contact", label: "E-mail de contact" },
    { key: "email_support", label: "E-mail du support" },
    { key: "address", label: "Adresse" },
  ] },
  { title: "Informations l\u00e9gales", fields: [
    { key: "company_name", label: "Nom de l'entreprise" },
    { key: "dfe", label: "Num\u00e9ro DFE" },
    { key: "rccm", label: "Num\u00e9ro RCCM" },
  ] },
  { title: "Signature et pied de page", fields: [
    { key: "footer_signature", label: "Signature du site (pied de page)", area: true },
  ] },
  { title: "Textes juridiques", fields: [
    { key: "terms", label: "Conditions d'utilisation", area: true },
    { key: "privacy", label: "Politique de confidentialit\u00e9", area: true },
  ] },
  { title: "E-mails envoy\u00e9s aux couples", fields: [
    { key: "mail_from", label: "Adresse d'envoi" },
    { key: "mail_signature", label: "Signature des e-mails", area: true },
    { key: "mail_welcome", label: "Message de bienvenue", area: true },
  ] },
];

export default function SettingsEditor() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [faq, setFaq] = useState<Faq[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.success) {
          setVals(d.values || {});
          try {
            const arr = JSON.parse((d.values && d.values.faq) || "[]");
            if (Array.isArray(arr)) setFaq(arr.map((x: any) => ({ q: String(x.q || ""), a: String(x.a || "") })));
          } catch {}
        } else {
          setOk(false);
          setMsg((d && d.message) || "Chargement impossible.");
        }
      })
      .catch(() => { setOk(false); setMsg("Connexion indisponible."); });
  }, []);

  const set = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }));
  const setItem = (i: number, patch: Partial<Faq>) => setFaq((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) =>
    setFaq((p) => {
      const j = i + d;
      if (j < 0 || j >= p.length) return p;
      const c = [...p];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const values = { ...vals, faq: JSON.stringify(faq.filter((f) => f.q.trim())) };
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d && d.success) { setOk(true); setMsg("Param\u00e8tres enregistr\u00e9s \u2714"); }
      else { setOk(false); setMsg((d && d.message) || "Enregistrement impossible."); }
    } catch {
      setOk(false);
      setMsg("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6 text-xs">
      <h3 className="font-serif font-bold text-stone-900 text-base border-b border-stone-100 pb-3">
        {"Informations du site"}
      </h3>

      {SECTIONS.map((s) => (
        <div key={s.title} className="space-y-3">
          <h4 className="font-bold text-stone-900 text-sm">{s.title}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {s.fields.map((f) => (
              <div key={f.key} className={f.area ? "md:col-span-2" : ""}>
                <label className={lab}>{f.label}</label>
                {f.area ? (
                  <textarea rows={6} value={vals[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} className={inp} />
                ) : (
                  <input value={vals[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} className={inp} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-3">
        <h4 className="font-bold text-stone-900 text-sm">{"Questions fr\u00e9quentes (FAQ)"}</h4>
        {faq.length === 0 && <p className="text-stone-500">{"Aucune question pour l'instant."}</p>}
        {faq.map((f, i) => (
          <div key={i} className="p-3 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
            <input value={f.q} onChange={(e) => setItem(i, { q: e.target.value })} placeholder="Question" className={inp} />
            <textarea rows={3} value={f.a} onChange={(e) => setItem(i, { a: e.target.value })} placeholder={"R\u00e9ponse"} className={inp} />
            <div className="flex gap-2">
              <button type="button" onClick={() => move(i, -1)} className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-bold cursor-pointer">{"Monter"}</button>
              <button type="button" onClick={() => move(i, 1)} className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-bold cursor-pointer">{"Descendre"}</button>
              <button type="button" onClick={() => setFaq((p) => p.filter((_, j) => j !== i))} className="px-3 py-1.5 rounded-lg border border-red-300 bg-white text-red-700 font-bold cursor-pointer">{"Supprimer"}</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setFaq((p) => [...p, { q: "", a: "" }])} className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold cursor-pointer">
          {"Ajouter une question"}
        </button>
      </div>

      {msg && (
        <div className={"p-3 rounded-xl border font-semibold text-center " + (ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800")}>
          {msg}
        </div>
      )}
      <button type="button" disabled={busy} onClick={save} className="w-full py-3 rounded-2xl bg-stone-900 text-white font-bold hover:bg-stone-800 cursor-pointer disabled:opacity-60">
        {busy ? "Enregistrement..." : "Enregistrer les informations du site"}
      </button>
    </div>
  );
}