"use client";

import { useEffect, useState } from "react";
import FileUpload from "@/components/admin/FileUpload";

type Item = { id?: string; key: string; title: string; content: string; media_url: string; is_active: boolean };

const KEYS: Array<[string, string]> = [
  ["header_video", "Vid\u00e9o En-t\u00eate (loop accueil)"],
  ["footer_about", "Footer - \u00c0 propos"],
  ["footer_contact", "Footer - Contact"],
  ["footer_legal", "Footer - Mentions l\u00e9gales"],
  ["footer_social", "Footer - R\u00e9seaux sociaux"],
];
const EMPTY: Item = { key: "header_video", title: "", content: "", media_url: "", is_active: true };

export default function Page() {
  const [contents, setContents] = useState<Item[]>([]);
  const [form, setForm] = useState<Item>(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/admin/site-contents", { cache: "no-store" });
      const j = await r.json();
      if (j && j.success) setContents(j.contents || []);
    } catch {}
  }
  useEffect(() => { void load(); }, []);

  function pick(key: string) {
    const f = contents.find((c) => c.key === key);
    setForm(f ? { ...f } : { ...EMPTY, key });
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/site-contents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json().catch(() => null);
      if (res.ok && d && d.success) { setOk(true); setMsg("Contenu enregistr\u00e9 \u2714"); await load(); }
      else { setOk(false); setMsg((d && d.message) || "Enregistrement impossible."); }
    } catch {
      setOk(false);
      setMsg("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#800020]">{"Contenu & Footer"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {"G\u00e9rez la vid\u00e9o d'en-t\u00eate (en boucle) de la page d'accueil et les textes du pied de page. Choisissez une cl\u00e9 : son contenu actuel se charge, vous le modifiez puis vous enregistrez."}
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border space-y-4">
        <div>
          <label className="text-xs font-semibold">{"Cl\u00e9 *"}</label>
          <select className="w-full border p-2 rounded mt-1" value={form.key} onChange={(e) => pick(e.target.value)}>
            {KEYS.map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
          </select>
        </div>
        <input className="w-full border p-2 rounded" placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="w-full border p-2 rounded h-32" placeholder={"Texte affich\u00e9 sur le site"} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <FileUpload label={"M\u00e9dia : vid\u00e9o ou image depuis le disque (pour l'en-t\u00eate)"} folder="contenu" accept="video/*,image/*" value={form.media_url} onUploaded={(url) => setForm({ ...form, media_url: url })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          {"Affich\u00e9 sur le site"}
        </label>
        {msg && (
          <div className={"p-3 rounded-lg border text-sm font-semibold " + (ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800")}>{msg}</div>
        )}
        <button type="button" disabled={busy} onClick={save} className="bg-[#D4AF37] text-white px-6 py-2 rounded font-bold disabled:opacity-60">
          {busy ? "Enregistrement..." : "Enregistrer le contenu"}
        </button>
      </div>

      <div className="space-y-2">
        {contents.map((c) => (
          <div key={c.key} className="bg-white border rounded p-2 text-sm flex items-center justify-between gap-3">
            <span><b>{c.key}</b>{c.title ? " - " + c.title : ""}{c.is_active ? "" : " (masqu\u00e9)"}</span>
            <button type="button" onClick={() => setForm({ ...c })} className="px-3 py-1 rounded border text-xs font-bold">{"Modifier"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}