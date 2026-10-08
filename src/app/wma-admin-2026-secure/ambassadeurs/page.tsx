"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

type Amb = {
  id: number;
  name: string;
  ambassador_code: string | null;
  code_unique: string | null;
  referral_slug: string | null;
  country_slug: string | null;
  city: string | null;
  bio: string | null;
  photo_url: string | null;
  payment_method: string;
  payment_number: string | null;
  payout_day: number;
  is_featured: boolean;
  is_active: boolean;
  total_clicks: number;
  total_clients: number;
  balance: number | string;
  total_sales: number | string;
  total_commissions: number | string;
};
type Country = { slug: string; name: string; flag: string | null };

const METHODS: Array<[string, string]> = [
  ["wave", "Wave"], ["orange_money", "Orange Money"], ["mtn_money", "MTN Money"], ["moov_money", "Moov Money"],
  ["airtel_money", "Airtel Money"], ["mpesa", "M-Pesa"], ["virement", "Virement"],
];
const DAYS: Array<[number, string]> = [[1, "Lundi"], [2, "Mardi"], [3, "Mercredi"], [4, "Jeudi"], [5, "Vendredi"], [6, "Samedi"], [7, "Dimanche"]];
const fcfa = (v: number | string) => Number(v || 0).toLocaleString("fr-FR") + " F";

async function squareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const out = Math.min(640, size);
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image illisible.");
  ctx.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, out, out);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Conversion impossible."))), "image/jpeg", 0.88);
  });
}

// Recadre la photo en carre, la convertit en JPEG leger, puis l'envoie
async function uploadPhoto(file: File): Promise<{ url: string }> {
  let body: Blob = file;
  let contentType = file.type || "image/jpeg";
  let pathname = "ambassadors/" + Date.now() + ".jpg";
  try {
    body = await squareJpeg(file);
    contentType = "image/jpeg";
  } catch {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      throw new Error("Format de photo non pris en charge : utilisez une photo JPG ou PNG.");
    }
    pathname = "ambassadors/" + Date.now() + "-" + file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  }
  try {
    return await upload(pathname, body, { access: "public", handleUploadUrl: "/api/admin/library/upload", contentType });
  } catch (e) {
    throw new Error("Envoi de la photo impossible : " + (e instanceof Error ? e.message : "erreur inconnue"));
  }
}
export default function AdminAmbassadeursPage() {
  const [list, setList] = useState<Amb[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [rate, setRate] = useState("15");
  const [minBalance, setMinBalance] = useState("10000");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (msg && /impossible|erreur|format|refus|indisponible/i.test(msg)) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [msg]);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<{ name: string; code: string; pin: string } | null>(null);

  const [name, setName] = useState("");
  const [countrySlug, setCountrySlug] = useState("ci");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [method, setMethod] = useState("wave");
  const [number, setNumber] = useState("");
  const [day, setDay] = useState(5);
  const [featured, setFeatured] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/ambassadors", { cache: "no-store" });
      const d = await res.json();
      if (res.ok && d.success) {
        setList(d.ambassadors as Amb[]);
        setCountries(d.countries as Country[]);
        setRate(String(d.settings.commission_rate));
        setMinBalance(String(d.settings.payout_min_balance));
      } else setMsg(d.message || "Connectez-vous d'abord \u00e0 l'espace admin.");
    } catch {
      setMsg("Connexion indisponible.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const call = async (method: string, url: string, payload: unknown) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: payload ? JSON.stringify(payload) : undefined });
      const d = await res.json().catch(() => null);
      if (res.ok && d && d.success) return d;
      setMsg((d && d.message) || "Action impossible.");
    } catch {
      setMsg("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
    return null;
  };

  const create = async () => {
    setBusy(true);
    setMsg(null);
    try {
      let photoUrl = "";
      if (photo) {
        const up = await uploadPhoto(photo);
        photoUrl = up.url;
      }
      const res = await fetch("/api/admin/ambassadors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, countrySlug, city, phone, bio, paymentMethod: method, paymentNumber: number, payoutDay: day, isFeatured: featured, photoUrl }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d && d.success) {
        setSecret({ name: d.ambassador.name, code: d.ambassador.code_unique, pin: d.pin });
        setName(""); setCity(""); setPhone(""); setBio(""); setNumber(""); setPhoto(null); setFeatured(false);
        await load();
      } else setMsg((d && d.message) || "Cr\u00e9ation impossible.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Cr\u00e9ation impossible.");
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = async () => {
    const d = await call("PATCH", "/api/admin/ambassadors", { action: "settings", commissionRate: Number(rate), payoutMinBalance: Number(minBalance) });
    if (d) setMsg("R\u00e9glages enregistr\u00e9s \u2714");
  };

  const patchLocal = (id: number, patch: Partial<Amb>) => setList((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const saveOne = async (a: Amb) => {
    const d = await call("PATCH", "/api/admin/ambassadors", {
      id: a.id, bio: a.bio ?? "", city: a.city ?? "", paymentMethod: a.payment_method, paymentNumber: a.payment_number ?? "",
      payoutDay: a.payout_day, isFeatured: a.is_featured, isActive: a.is_active, photoUrl: a.photo_url ?? "",
    });
    if (d) setMsg("Modifications enregistr\u00e9es \u2714");
  };

  const changePhoto = async (a: Amb, file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const up = await uploadPhoto(file);
      patchLocal(a.id, { photo_url: up.url });
      setMsg("Photo envoy\u00e9e : appuyez sur Enregistrer.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Envoi de la photo impossible.");
    } finally {
      setBusy(false);
    }
  };

  const resetPin = async (a: Amb) => {
    const d = await call("PATCH", "/api/admin/ambassadors", { action: "reset-pin", id: a.id });
    if (d) setSecret({ name: a.name, code: a.code_unique ?? "", pin: d.pin });
  };

  const remove = async (a: Amb) => {
    if (!window.confirm("Supprimer " + a.name + " ?")) return;
    const d = await call("DELETE", "/api/admin/ambassadors?id=" + a.id, null);
    if (d) await load();
  };

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setMsg("Copi\u00e9 \u2714");
  };

  const box = { padding: 14, border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", display: "grid", gap: 10 } as const;
  const input = { width: "100%", padding: "8px 10px", border: "1px solid #d6d3d1", borderRadius: 10, fontSize: 14 } as const;
  const lab = { fontSize: 12, fontWeight: 700, display: "grid", gap: 4 } as const;
  const btn = (bg: string) => ({ padding: "8px 12px", borderRadius: 10, border: 0, color: "#fff", background: bg, fontWeight: 700, fontSize: 13, cursor: "pointer" }) as const;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div style={{ display: "grid", gap: 16, padding: 16, paddingBottom: 64, maxWidth: 820, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{"Ambassadeurs"}</h1>
      {msg && <p style={{ fontSize: 13 }}>{msg}</p>}

      {secret && (
        <div style={{ ...box, border: "2px solid #C05638", background: "#FFF7ED" }}>
          <strong>{"Acc\u00e8s de " + secret.name + " : \u00e0 transmettre maintenant"}</strong>
          <span style={{ fontFamily: "monospace", fontSize: 16 }}>{"Code : " + secret.code}</span>
          <span style={{ fontFamily: "monospace", fontSize: 16 }}>{"PIN : " + secret.pin}</span>
          <span style={{ fontSize: 12, color: "#57534e" }}>{"Le PIN n'est affich\u00e9 qu'une seule fois (il est enregistr\u00e9 chiffr\u00e9). Vous pourrez en g\u00e9n\u00e9rer un nouveau."}</span>
          <button type="button" style={btn("#6b7280")} onClick={() => setSecret(null)}>{"J'ai not\u00e9 les acc\u00e8s"}</button>
        </div>
      )}

      <div style={box}>
        <strong>{"R\u00e9glages"}</strong>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <label style={lab}>{"Commission (%)"}<input style={input} type="number" min={0} max={100} value={rate} onChange={(e) => setRate(e.target.value)} /></label>
          <label style={lab}>{"Seuil de paiement (F)"}<input style={input} type="number" min={0} value={minBalance} onChange={(e) => setMinBalance(e.target.value)} /></label>
        </div>
        <button type="button" disabled={busy} style={btn("#2563eb")} onClick={saveSettings}>{"Enregistrer les r\u00e9glages"}</button>
      </div>

      <div style={box}>
        <strong>{"Nouvel ambassadeur"}</strong>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label style={lab}>{"Nom complet"}<input style={input} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label style={lab}>
            {"Pays"}
            <select style={input} value={countrySlug} onChange={(e) => setCountrySlug(e.target.value)}>
              {countries.map((c) => (
                <option key={c.slug} value={c.slug}>{(c.flag ? c.flag + " " : "") + c.name}</option>
              ))}
            </select>
          </label>
          <label style={lab}>{"Ville"}<input style={input} value={city} onChange={(e) => setCity(e.target.value)} /></label>
          <label style={lab}>{"T\u00e9l\u00e9phone"}<input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <label style={lab}>
            {"Mode de paiement"}
            <select style={input} value={method} onChange={(e) => setMethod(e.target.value)}>
              {METHODS.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
            </select>
          </label>
          <label style={lab}>{"Num\u00e9ro de paiement"}<input style={input} value={number} onChange={(e) => setNumber(e.target.value)} /></label>
          <label style={lab}>
            {"Jour de paiement"}
            <select style={input} value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {DAYS.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
            </select>
          </label>
          <label style={lab}>{"Photo"}<input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></label>
          {photo && <span style={{ fontSize: 12, color: "#15803d" }}>{"Photo s\u00e9lectionn\u00e9e : " + photo.name}</span>}
        </div>
        <label style={lab}>{"Courte pr\u00e9sentation (500 caract\u00e8res max)"}<textarea style={{ ...input, minHeight: 70 }} value={bio} onChange={(e) => setBio(e.target.value)} /></label>
        <label style={{ display: "flex", gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          <span>{"Afficher sur l'accueil (Nos ambassadeurs)"}</span>
        </label>
        <button type="button" disabled={busy} style={btn("#C05638")} onClick={create}>{"Cr\u00e9er l'ambassadeur"}</button>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700 }}>{"Ambassadeurs (" + list.length + ")"}</h2>
      {list.map((a) => {
        const link = origin + "/r/" + (a.referral_slug ?? "");
        return (
          <div key={a.id} style={{ ...box, opacity: a.is_active ? 1 : 0.6 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {a.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.photo_url} alt="" style={{ width: 56, height: 56, borderRadius: 999, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 999, background: "#f5f5f4" }} />
              )}
              <div>
                <strong>{a.name}</strong>
                <div style={{ fontSize: 12, color: "#78716c" }}>{(a.city || "") + " \u2022 " + (a.country_slug || "").toUpperCase()}</div>
                <div style={{ fontSize: 12, fontFamily: "monospace" }}>{(a.code_unique || "") + "  |  " + (a.ambassador_code || "")}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span>{"Clics : " + a.total_clicks}</span>
              <span>{"Clients : " + a.total_clients}</span>
              <span>{"Ventes : " + fcfa(a.total_sales)}</span>
              <span>{"Commissions : " + fcfa(a.total_commissions)}</span>
              <strong>{"Solde : " + fcfa(a.balance)}</strong>
            </div>
            <div style={{ fontSize: 12, wordBreak: "break-all" }}>{link}</div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <label style={lab}>{"Ville"}<input style={input} value={a.city || ""} onChange={(e) => patchLocal(a.id, { city: e.target.value })} /></label>
              <label style={lab}>
                {"Mode de paiement"}
                <select style={input} value={a.payment_method} onChange={(e) => patchLocal(a.id, { payment_method: e.target.value })}>
                  {METHODS.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                </select>
              </label>
              <label style={lab}>{"Num\u00e9ro de paiement"}<input style={input} value={a.payment_number || ""} onChange={(e) => patchLocal(a.id, { payment_number: e.target.value })} /></label>
              <label style={lab}>
                {"Jour de paiement"}
                <select style={input} value={a.payout_day} onChange={(e) => patchLocal(a.id, { payout_day: Number(e.target.value) })}>
                  {DAYS.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                </select>
              </label>
              <label style={lab}>{"Changer la photo"}<input type="file" accept="image/*" onChange={(e) => void changePhoto(a, e.target.files?.[0] ?? null)} /></label>
            </div>
            <label style={lab}>{"Pr\u00e9sentation"}<textarea style={{ ...input, minHeight: 60 }} value={a.bio || ""} onChange={(e) => patchLocal(a.id, { bio: e.target.value })} /></label>
            <div style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
              <label style={{ display: "flex", gap: 6 }}><input type="checkbox" checked={a.is_featured} onChange={(e) => patchLocal(a.id, { is_featured: e.target.checked })} />{"Sur l'accueil"}</label>
              <label style={{ display: "flex", gap: 6 }}><input type="checkbox" checked={a.is_active} onChange={(e) => patchLocal(a.id, { is_active: e.target.checked })} />{"Actif"}</label>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" disabled={busy} style={btn("#2563eb")} onClick={() => saveOne(a)}>{"Enregistrer"}</button>
              <button type="button" style={btn("#16a34a")} onClick={() => copy(link)}>{"Copier le lien"}</button>
              <button type="button" disabled={busy} style={btn("#B45309")} onClick={() => resetPin(a)}>{"Nouveau PIN"}</button>
              <button type="button" disabled={busy} style={btn("#dc2626")} onClick={() => remove(a)}>{"Supprimer"}</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}