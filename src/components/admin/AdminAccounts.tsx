"use client";

import { useEffect, useState } from "react";

type Me = { id: number; email: string; name: string; role: string };
type Row = { id: number; email: string; name: string; role: string; createdAt: string | null };

const inp = "w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs";
const lab = "block text-stone-700 font-bold mb-1 text-xs";
const dark = "px-4 py-2 rounded-xl bg-stone-900 text-white font-bold cursor-pointer disabled:opacity-60 text-xs";
const line = "px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-bold cursor-pointer text-xs";

function generate(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const a = new Uint32Array(16);
  crypto.getRandomValues(a);
  let s = "";
  a.forEach((n) => { s += chars[n % chars.length]; });
  return s;
}

export default function AdminAccounts() {
  const [me, setMe] = useState<Me | null>(null);
  const [list, setList] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(true);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<{ email: string; password: string } | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const [aName, setAName] = useState("");
  const [aEmail, setAEmail] = useState("");
  const [aPass, setAPass] = useState("");
  const [aRole, setARole] = useState("admin");

  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPass, setResetPass] = useState("");

  const load = async () => {
    try {
      const r = await fetch("/api/admin/admins", { cache: "no-store" });
      const d = await r.json();
      if (d && d.success) {
        setMe(d.me);
        setList(d.admins || []);
        setEmail(d.me.email);
        setName(d.me.name);
      } else {
        setOk(false);
        setMsg((d && d.message) || "Chargement impossible.");
      }
    } catch {
      setOk(false);
      setMsg("Connexion indisponible.");
    }
  };
  useEffect(() => { void load(); }, []);

  const call = async (method: string, url: string, payload?: unknown) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: payload ? JSON.stringify(payload) : undefined });
      const d = await res.json().catch(() => null);
      if (res.ok && d && d.success) return d;
      setOk(false);
      setMsg((d && d.message) || "Action impossible (" + res.status + ").");
    } catch {
      setOk(false);
      setMsg("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
    return null;
  };

  const saveSelf = async () => {
    if (!me) return;
    if (!currentPw) { setOk(false); setMsg("Saisissez votre mot de passe actuel pour confirmer."); return; }
    const d = await call("PATCH", "/api/admin/admins", {
      action: "update-self",
      currentPassword: currentPw,
      newEmail: email.trim().toLowerCase() !== me.email ? email.trim() : undefined,
      name: name.trim() !== me.name ? name.trim() : undefined,
      newPassword: newPw || undefined,
    });
    if (d) {
      setOk(true);
      setMsg("Compte mis \u00e0 jour \u2714");
      setCurrentPw("");
      setNewPw("");
      await load();
    }
  };

  const addAdmin = async () => {
    const d = await call("POST", "/api/admin/admins", { name: aName, email: aEmail, password: aPass, role: aRole });
    if (d) {
      setOk(true);
      setMsg("Administrateur cr\u00e9\u00e9 \u2714");
      setShown({ email: aEmail.trim().toLowerCase(), password: aPass });
      setAName(""); setAEmail(""); setAPass(""); setARole("admin");
      await load();
    }
  };

  const reset = async (id: number, mail: string) => {
    const d = await call("PATCH", "/api/admin/admins", { action: "reset-password", id, newPassword: resetPass });
    if (d) {
      setOk(true);
      setMsg("Mot de passe modifi\u00e9 \u2714");
      setShown({ email: mail, password: resetPass });
      setResetId(null);
      setResetPass("");
    }
  };

  const remove = async (a: Row) => {
    if (!window.confirm("Supprimer le compte " + a.email + " ?")) return;
    const d = await call("DELETE", "/api/admin/admins?id=" + a.id);
    if (d) { setOk(true); setMsg("Compte supprim\u00e9 \u2714"); await load(); }
  };

  const isSuper = me?.role === "superadmin";

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6 text-xs">
      <h3 className="font-serif font-bold text-stone-900 text-base border-b border-stone-100 pb-3">{"Administrateurs"}</h3>

      {msg && (
        <div className={"p-3 rounded-xl border font-semibold " + (ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800")}>{msg}</div>
      )}
      {shown && (
        <div className="p-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 space-y-1">
          <div className="font-bold">{"\u00c0 communiquer en priv\u00e9 (affich\u00e9 une seule fois)"}</div>
          <div>{"Adresse : " + shown.email}</div>
          <div style={{ fontFamily: "monospace" }}>{"Mot de passe : " + shown.password}</div>
          <button type="button" className={line} onClick={() => setShown(null)}>{"J'ai not\u00e9 le mot de passe"}</button>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="font-bold text-stone-900 text-sm">{"Mon compte"}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className={lab}>{"Adresse e-mail de connexion"}</label><input type="email" className={inp} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className={lab}>{"Nom affich\u00e9"}</label><input className={inp} value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className={lab}>{"Nouveau mot de passe (facultatif, 10 caract\u00e8res minimum)"}</label><input type="password" autoComplete="new-password" className={inp} value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
          <div><label className={lab}>{"Mot de passe actuel (obligatoire pour enregistrer)"}</label><input type="password" autoComplete="current-password" className={inp} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} /></div>
        </div>
        <button type="button" disabled={busy || !me} onClick={saveSelf} className={dark}>{"Enregistrer mon compte"}</button>
      </div>

      {isSuper && (
        <>
          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 text-sm">{"Comptes administrateurs"}</h4>
            {list.map((a) => (
              <div key={a.id} className="p-3 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong>{a.name}</strong>{me && a.id === me.id ? " (vous)" : ""}
                    <div>{a.email}</div>
                    <div className="text-stone-500">{(a.role === "superadmin" ? "Super administrateur" : "Administrateur") + (a.createdAt ? " - cr\u00e9\u00e9 le " + new Date(a.createdAt).toLocaleDateString("fr-FR") : "")}</div>
                  </div>
                  {me && a.id !== me.id && (
                    <div className="flex gap-2">
                      <button type="button" className={line} onClick={() => { setResetId(resetId === a.id ? null : a.id); setResetPass(""); }}>{"Nouveau mot de passe"}</button>
                      <button type="button" className={line + " text-red-700 border-red-300"} onClick={() => remove(a)}>{"Supprimer"}</button>
                    </div>
                  )}
                </div>
                {resetId === a.id && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <input className={inp + " flex-1"} style={{ minWidth: 220 }} value={resetPass} onChange={(e) => setResetPass(e.target.value)} placeholder={"Nouveau mot de passe (10 caract\u00e8res minimum)"} />
                    <button type="button" className={line} onClick={() => setResetPass(generate())}>{"G\u00e9n\u00e9rer"}</button>
                    <button type="button" disabled={busy} className={dark} onClick={() => reset(a.id, a.email)}>{"Enregistrer"}</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 text-sm">{"Ajouter un administrateur"}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className={lab}>{"Nom"}</label><input className={inp} value={aName} onChange={(e) => setAName(e.target.value)} /></div>
              <div><label className={lab}>{"Adresse e-mail"}</label><input type="email" className={inp} value={aEmail} onChange={(e) => setAEmail(e.target.value)} /></div>
              <div>
                <label className={lab}>{"Mot de passe (10 caract\u00e8res minimum)"}</label>
                <div className="flex gap-2">
                  <input className={inp} value={aPass} onChange={(e) => setAPass(e.target.value)} />
                  <button type="button" className={line} onClick={() => setAPass(generate())}>{"G\u00e9n\u00e9rer"}</button>
                </div>
              </div>
              <div>
                <label className={lab}>{"R\u00f4le"}</label>
                <select className={inp} value={aRole} onChange={(e) => setARole(e.target.value)}>
                  <option value="admin">{"Administrateur (sans gestion des comptes)"}</option>
                  <option value="superadmin">{"Super administrateur (gestion des comptes)"}</option>
                </select>
              </div>
            </div>
            <button type="button" disabled={busy} onClick={addAdmin} className={dark}>{"Ajouter l'administrateur"}</button>
          </div>
        </>
      )}
    </div>
  );
}