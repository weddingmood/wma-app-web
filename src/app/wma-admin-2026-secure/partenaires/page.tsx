"use client";

import { useEffect, useState } from "react";
import FileUpload from "@/components/admin/FileUpload";

type P = { id: string; name: string; logo_url: string | null; website: string | null; video_url?: string | null; type?: string | null; order_index: number; is_active: boolean };
const EMPTY = { name: "", logo_url: "", website: "", video_url: "", type: "logo", order_index: 0, is_active: true };

export default function Page() {
  const [list, setList] = useState<P[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/admin/partenaires", { cache: "no-store" });
      const j = await r.json();
      if (j && j.success) setList(j.partenaires || []);
      else setMsg((j && j.message) || "Chargement impossible.");
    } catch {
      setMsg("Connexion indisponible.");
    }
  }
  useEffect(() => { void load(); }, []);

  function flash(m: string, good: boolean) {
    setOk(good);
    setMsg(m);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function call(method: string, url: string, body?: unknown) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const d = await res.json().catch(() => null);
      if (res.ok && d && d.success) return d;
      flash((d && d.message) || "Action impossible (" + res.status + ").", false);
    } catch {
      flash("Connexion indisponible.", false);
    } finally {
      setBusy(false);
    }
    return null;
  }

  async function save() {
    const d = await call("POST", "/api/admin/partenaires", form);
    if (d) { setForm({ ...EMPTY }); flash("Partenaire ajout\u00e9 \u2714", true); await load(); }
  }
  async function toggle(p: P) {
    const d = await call("PATCH", "/api/admin/partenaires", { id: p.id, is_active: !p.is_active });
    if (d) await load();
  }
  async function reorder(p: P, value: number) {
    if (value === p.order_index) return;
    const d = await call("PATCH", "/api/admin/partenaires", { id: p.id, order_index: value });
    if (d) { flash("Ordre enregistr\u00e9 \u2714", true); await load(); }
  }
  async function remove(p: P) {
    if (!window.confirm("Supprimer " + p.name + " ?")) return;
    const d = await call("DELETE", "/api/admin/partenaires?id=" + p.id);
    if (d) { flash("Partenaire supprim\u00e9 \u2714", true); await load(); }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#800020]">{"Partenaires : logos du pied de page"}</h1>
        <p className="text-sm text-gray-500 mt-1">{"Les logos actifs s'affichent dans le pied de page du site. Ajoutez le logo depuis votre disque, sans passer par une adresse web."}</p>
      </div>

      {msg && (
        <div className={"p-3 rounded-lg border text-sm font-semibold " + (ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800")}>{msg}</div>
      )}

      <div className="bg-white p-4 rounded-xl border space-y-4">
        <input className="w-full border p-2 rounded" placeholder={"Nom du partenaire (exemple : H\u00f4tel Ivoire)"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold">{"Type"}</label>
            <select className="w-full border p-2 rounded mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="logo">{"Logo (image)"}</option>
              <option value="document">{"Document (PDF ou image)"}</option>
              <option value="video">{"Vid\u00e9o YouTube"}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">{"Ordre d'affichage (0 = premier)"}</label>
            <input className="w-full border p-2 rounded mt-1" type="number" min={0} value={form.order_index} onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })} />
          </div>
        </div>
        {form.type !== "video" ? (
          <FileUpload label={"Logo ou document : choisissez le fichier (JPG, PNG, WEBP, PDF)"} folder="partenaires" accept="image/*,.pdf" value={form.logo_url} onUploaded={(url) => setForm({ ...form, logo_url: url })} />
        ) : (
          <input className="w-full border p-2 rounded" placeholder="Lien YouTube : https://youtu.be/..." value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
        )}
        <input className="w-full border p-2 rounded" placeholder={"Site web du partenaire (facultatif) : https://..."} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          {"Affich\u00e9 sur le site"}
        </label>
        <button type="button" disabled={busy} onClick={save} className="bg-[#D4AF37] text-white px-6 py-2 rounded font-bold disabled:opacity-60">
          {busy ? "Enregistrement..." : "Ajouter le partenaire"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {list.map((p) => (
          <div key={p.id} className={"bg-white border rounded-xl p-3 space-y-2 " + (p.is_active ? "" : "opacity-60")}>
            {p.logo_url ? (
              <img src={p.logo_url} alt={p.name} className="h-16 mx-auto object-contain" />
            ) : (
              <div className="h-16 flex items-center justify-center text-xs text-gray-400">{p.video_url ? "Vid\u00e9o" : "Sans fichier"}</div>
            )}
            <p className="text-xs font-semibold text-center">{p.name}</p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <span>{"Ordre"}</span>
              <input type="number" min={0} defaultValue={p.order_index} onBlur={(e) => reorder(p, Number(e.target.value))} className="w-14 border rounded p-1" />
            </div>
            <div className="flex gap-2 justify-center">
              <button type="button" disabled={busy} onClick={() => toggle(p)} className="px-2 py-1 rounded border text-xs font-bold">{p.is_active ? "Masquer" : "Afficher"}</button>
              <button type="button" disabled={busy} onClick={() => remove(p)} className="px-2 py-1 rounded border border-red-300 text-red-700 text-xs font-bold">{"Supprimer"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}