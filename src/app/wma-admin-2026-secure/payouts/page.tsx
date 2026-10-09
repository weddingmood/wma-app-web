"use client";

import { useCallback, useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

type Due = {
  id: number; name: string; photo_url: string | null; country_slug: string | null; city: string | null;
  payment_method: string; payment_number: string | null; payout_day: number; balance: number | string;
  last_payout_at: string | null; last_payout_amount: number | string | null;
};
type Hist = {
  id: number; amount: number | string; payment_method: string | null; payment_number: string | null; status: string;
  payout_date: string | null; proof_image: string | null; notes: string | null; created_at: string; name: string; country_slug: string | null;
};
type AmbOpt = { id: number; name: string; country_slug: string | null };

const METHOD_LABEL: Record<string, string> = {
  wave: "Wave", orange_money: "Orange Money", mtn_money: "MTN Money", moov_money: "Moov Money",
  airtel_money: "Airtel Money", mpesa: "M-Pesa", virement: "Virement",
};
const STATUS_LABEL: Record<string, string> = { en_attente: "En attente", envoye: "Envoy\u00e9", paye: "Pay\u00e9", echoue: "\u00c9chou\u00e9" };
const DAYS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const fcfa = (v: number | string) => Number(v || 0).toLocaleString("fr-FR") + " F";

async function proofJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image illisible.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Conversion impossible."))), "image/jpeg", 0.82);
  });
}

async function uploadProof(file: File): Promise<{ url: string }> {
  let body: Blob = file;
  let contentType = file.type || "image/jpeg";
  let pathname = "payouts/" + Date.now() + ".jpg";
  try {
    body = await proofJpeg(file);
    contentType = "image/jpeg";
  } catch {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Format non pris en charge : utilisez une capture JPG ou PNG.");
    pathname = "payouts/" + Date.now() + "-" + file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  }
  try {
    return await upload(pathname, body, { access: "public", handleUploadUrl: "/api/admin/library/upload", contentType });
  } catch (e) {
    throw new Error("Envoi de la preuve impossible : " + (e instanceof Error ? e.message : "erreur inconnue"));
  }
}

export default function AdminPayoutsPage() {
  const [due, setDue] = useState<Due[]>([]);
  const [history, setHistory] = useState<Hist[]>([]);
  const [ambs, setAmbs] = useState<AmbOpt[]>([]);
  const [minBalance, setMinBalance] = useState(10000);
  const [paidWeek, setPaidWeek] = useState({ total: 0, count: 0 });
  const [includeBelow, setIncludeBelow] = useState(false);
  const [fAmb, setFAmb] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fCountry, setFCountry] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [proof, setProof] = useState<File | null>(null);

  useEffect(() => {
    if (msg && /impossible|erreur|invalide|d\u00e9passe|refus/i.test(msg)) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [msg]);

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (includeBelow) q.set("includeBelow", "1");
    if (fAmb) q.set("ambassadorId", fAmb);
    if (fStatus) q.set("status", fStatus);
    if (fFrom) q.set("from", fFrom);
    if (fTo) q.set("to", fTo);
    if (fCountry) q.set("country", fCountry);
    try {
      const res = await fetch("/api/admin/payouts?" + q.toString(), { cache: "no-store" });
      const d = await res.json();
      if (res.ok && d.success) {
        setDue(d.due as Due[]);
        setHistory(d.history as Hist[]);
        setAmbs(d.ambassadors as AmbOpt[]);
        setMinBalance(Number(d.minBalance));
        setPaidWeek(d.paidThisWeek);
      } else setMsg(d.message || "Connectez-vous d'abord \u00e0 l'espace admin.");
    } catch {
      setMsg("Connexion indisponible.");
    }
  }, [includeBelow, fAmb, fStatus, fFrom, fTo, fCountry]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalDue = due.reduce((s, a) => s + Number(a.balance || 0), 0);
  const todayDay = ((new Date().getDay() + 6) % 7) + 1;
  const countries = Array.from(new Set(ambs.map((a) => a.country_slug).filter(Boolean))) as string[];

  const openPanel = (a: Due) => {
    setOpenId(a.id);
    setAmount(String(Math.round(Number(a.balance))));
    setNotes("");
    setProof(null);
    setMsg(null);
  };

  const confirmPay = async (a: Due) => {
    const value = Math.round(Number(amount));
    if (!Number.isFinite(value) || value < 1 || value > Number(a.balance)) {
      setMsg("Montant invalide : entre 1 et " + fcfa(a.balance) + ".");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      let proofUrl = "";
      if (proof) proofUrl = (await uploadProof(proof)).url;
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ambassadorId: a.id, amount: value, notes, proofImage: proofUrl }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d && d.success) {
        setMsg("Paiement de " + fcfa(value) + " enregistr\u00e9 pour " + a.name + " \u2714");
        setOpenId(null);
        await load();
      } else setMsg((d && d.message) || "Enregistrement impossible.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setMsg("Num\u00e9ro copi\u00e9 \u2714");
  };

  const exportCsv = () => {
    const head = ["Date", "Ambassadeur", "Pays", "Montant (F)", "M\u00e9thode", "Num\u00e9ro", "Statut", "Notes", "Preuve"];
    const rows = history.map((h) => [
      new Date(h.created_at).toLocaleString("fr-FR"), h.name, (h.country_slug || "").toUpperCase(), String(Number(h.amount)),
      METHOD_LABEL[h.payment_method || ""] || h.payment_method || "", h.payment_number || "", STATUS_LABEL[h.status] || h.status,
      (h.notes || "").replace(/\s+/g, " "), h.proof_image || "",
    ]);
    const esc = (v: string) => '"' + v.replace(/"/g, '""') + '"';
    const csv = "\uFEFF" + [head, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "paiements-ambassadeurs.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const box = { padding: 14, border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", display: "grid", gap: 10 } as const;
  const input = { width: "100%", padding: "8px 10px", border: "1px solid #d6d3d1", borderRadius: 10, fontSize: 14 } as const;
  const lab = { fontSize: 12, fontWeight: 700, display: "grid", gap: 4 } as const;
  const btn = (bg: string) => ({ padding: "8px 12px", borderRadius: 10, border: 0, color: "#fff", background: bg, fontWeight: 700, fontSize: 13, cursor: "pointer" }) as const;

  return (
    <div style={{ display: "grid", gap: 16, padding: 16, paddingBottom: 64, maxWidth: 820, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{"Paiements des ambassadeurs"}</h1>
      {msg && <p style={{ fontSize: 13, padding: 10, borderRadius: 10, background: "#f5f5f4" }}>{msg}</p>}

      <div style={{ ...box, border: "2px solid #C05638", background: "#FFF7ED" }}>
        <strong style={{ fontSize: 16 }}>{"\u00c0 payer : " + fcfa(totalDue) + " pour " + due.length + " ambassadeur" + (due.length > 1 ? "s" : "")}</strong>
        <span style={{ fontSize: 12, color: "#57534e" }}>
          {"Seuil de paiement : " + fcfa(minBalance) + ". D\u00e9j\u00e0 pay\u00e9 cette semaine : " + fcfa(paidWeek.total) + " (" + paidWeek.count + " paiement" + (paidWeek.count > 1 ? "s" : "") + ")."}
        </span>
        <label style={{ display: "flex", gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={includeBelow} onChange={(e) => setIncludeBelow(e.target.checked)} />
          <span>{"Afficher aussi les ambassadeurs sous le seuil"}</span>
        </label>
      </div>

      {due.length === 0 && <p style={{ fontSize: 13, color: "#78716c" }}>{"Aucun ambassadeur \u00e0 payer pour le moment."}</p>}
      {due.map((a) => (
        <div key={a.id} style={box}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {a.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: 999, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 999, background: "#f5f5f4" }} />
            )}
            <div style={{ flex: 1 }}>
              <strong>{a.name}</strong>
              <div style={{ fontSize: 12, color: "#78716c" }}>{(a.city || "") + " \u2022 " + (a.country_slug || "").toUpperCase()}</div>
              <div style={{ fontSize: 12 }}>
                {(METHOD_LABEL[a.payment_method] || a.payment_method) + " : " + (a.payment_number || "num\u00e9ro manquant")}
              </div>
              <div style={{ fontSize: 12, color: a.payout_day === todayDay ? "#15803d" : "#78716c", fontWeight: a.payout_day === todayDay ? 700 : 400 }}>
                {"Jour de paiement : " + (DAYS[a.payout_day] || "") + (a.payout_day === todayDay ? " (aujourd'hui)" : "")}
              </div>
            </div>
            <strong style={{ fontSize: 18, color: "#C05638" }}>{fcfa(a.balance)}</strong>
          </div>
          {a.last_payout_at && (
            <div style={{ fontSize: 12, color: "#78716c" }}>
              {"Dernier paiement : " + fcfa(a.last_payout_amount || 0) + " le " + new Date(a.last_payout_at).toLocaleDateString("fr-FR")}
            </div>
          )}

          {openId !== a.id ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" style={btn("#16a34a")} onClick={() => openPanel(a)}>{"Marquer pay\u00e9"}</button>
              {a.payment_number && <button type="button" style={btn("#2563eb")} onClick={() => copy(a.payment_number as string)}>{"Copier le num\u00e9ro"}</button>}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10, padding: 12, borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <label style={lab}>{"Montant pay\u00e9 (F)"}<input style={input} type="number" min={1} max={Number(a.balance)} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
              <label style={lab}>
                {"Capture de la preuve (Wave, Orange Money\u2026)"}
                <input type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
                {proof && <span style={{ fontWeight: 400, color: "#15803d" }}>{"Fichier choisi : " + proof.name}</span>}
              </label>
              <label style={lab}>{"Notes"}<textarea style={{ ...input, minHeight: 60 }} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" disabled={busy} style={btn("#16a34a")} onClick={() => confirmPay(a)}>{busy ? "Enregistrement\u2026" : "Confirmer le paiement"}</button>
                <button type="button" disabled={busy} style={btn("#6b7280")} onClick={() => setOpenId(null)}>{"Annuler"}</button>
              </div>
              <span style={{ fontSize: 12, color: "#57534e" }}>{"Un paiement partiel laisse le reste du solde \u00e0 l'ambassadeur."}</span>
            </div>
          )}
        </div>
      ))}

      <h2 style={{ fontSize: 16, fontWeight: 700 }}>{"Historique des paiements"}</h2>
      <div style={{ ...box, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <label style={lab}>
          {"Ambassadeur"}
          <select style={input} value={fAmb} onChange={(e) => setFAmb(e.target.value)}>
            <option value="">{"Tous"}</option>
            {ambs.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
          </select>
        </label>
        <label style={lab}>
          {"Statut"}
          <select style={input} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="">{"Tous"}</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
          </select>
        </label>
        <label style={lab}>
          {"Pays"}
          <select style={input} value={fCountry} onChange={(e) => setFCountry(e.target.value)}>
            <option value="">{"Tous"}</option>
            {countries.map((c) => (<option key={c} value={c}>{c.toUpperCase()}</option>))}
          </select>
        </label>
        <label style={lab}>{"Du"}<input style={input} type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} /></label>
        <label style={lab}>{"Au"}<input style={input} type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} /></label>
      </div>
      <button type="button" style={{ ...btn("#B45309"), justifySelf: "start" }} onClick={exportCsv}>{"Exporter (CSV, s'ouvre dans Excel)"}</button>

      {history.length === 0 && <p style={{ fontSize: 13, color: "#78716c" }}>{"Aucun paiement enregistr\u00e9."}</p>}
      {history.map((h) => (
        <div key={h.id} style={{ ...box, gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <strong>{h.name}</strong>
            <strong>{fcfa(h.amount)}</strong>
          </div>
          <div style={{ fontSize: 12, color: "#78716c" }}>
            {new Date(h.created_at).toLocaleString("fr-FR") + " \u2022 " + (STATUS_LABEL[h.status] || h.status) + " \u2022 " + (METHOD_LABEL[h.payment_method || ""] || h.payment_method || "") + " " + (h.payment_number || "")}
          </div>
          {h.notes && <div style={{ fontSize: 12 }}>{h.notes}</div>}
          {h.proof_image && (
            <a href={h.proof_image} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#2563eb" }}>{"Voir la preuve"}</a>
          )}
        </div>
      ))}
    </div>
  );
}