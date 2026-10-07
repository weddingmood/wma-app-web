"use client";

import { useEffect, useState } from "react";

type Item = {
  id: number;
  couple_name: string;
  city: string | null;
  wedding_date: string | null;
  content: string;
  rating: number;
  status: string;
};

const STATUS_LABEL: Record<string, string> = { pending: "\u00c0 valider", approved: "Publi\u00e9", rejected: "Refus\u00e9" };

export default function AdminTemoignagesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nName, setNName] = useState("");
  const [nCity, setNCity] = useState("");
  const [nDate, setNDate] = useState("");
  const [nRating, setNRating] = useState(5);
  const [nContent, setNContent] = useState("");
  const [nConsent, setNConsent] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/testimonials", { cache: "no-store" });
      const d = await res.json();
      if (res.ok && d.success) setItems(d.testimonials as Item[]);
      else setMsg(d.message || "Connectez-vous d'abord \u00e0 l'espace admin.");
    } catch {
      setMsg("Connexion indisponible.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const call = async (method: string, url: string, payload: unknown, okMsg: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d && d.success) {
        setMsg(okMsg);
        await load();
        return true;
      }
      setMsg((d && d.message) || "Action impossible.");
    } catch {
      setMsg("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
    return false;
  };

  const patchLocal = (id: number, patch: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const addNew = async () => {
    const ok = await call(
      "POST",
      "/api/admin/testimonials",
      { coupleName: nName, city: nCity, weddingDate: nDate, rating: nRating, content: nContent, consent: nConsent },
      "T\u00e9moignage ajout\u00e9 et publi\u00e9 \u2714"
    );
    if (ok) {
      setNName("");
      setNCity("");
      setNDate("");
      setNContent("");
      setNConsent(false);
    }
  };

  const box = { padding: 14, border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", display: "grid", gap: 10 } as const;
  const input = { width: "100%", padding: "8px 10px", border: "1px solid #d6d3d1", borderRadius: 10, fontSize: 14 } as const;
  const lab = { fontSize: 12, fontWeight: 700, display: "grid", gap: 4 } as const;
  const btn = (bg: string) => ({ padding: "8px 12px", borderRadius: 10, border: 0, color: "#fff", background: bg, fontWeight: 700, fontSize: 13, cursor: "pointer" }) as const;

  return (
    <div style={{ display: "grid", gap: 16, padding: 16, paddingBottom: 64, maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{"T\u00e9moignages"}</h1>
      {msg && <p style={{ fontSize: 13 }}>{msg}</p>}

      <div style={box}>
        <strong>{"Ajouter un avis re\u00e7u directement (WhatsApp, appel\u2026)"}</strong>
        <label style={lab}>{"Nom affich\u00e9"}<input style={input} value={nName} onChange={(e) => setNName(e.target.value)} /></label>
        <label style={lab}>{"Ville"}<input style={input} value={nCity} onChange={(e) => setNCity(e.target.value)} /></label>
        <label style={lab}>{"Date du mariage (texte libre, ex. 04/2026)"}<input style={input} value={nDate} onChange={(e) => setNDate(e.target.value)} /></label>
        <label style={lab}>
          {"Note"}
          <select style={input} value={nRating} onChange={(e) => setNRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n + " sur 5"}</option>
            ))}
          </select>
        </label>
        <label style={lab}>
          {"Texte exact donn\u00e9 par le couple (20 \u00e0 600 caract\u00e8res)"}
          <textarea style={{ ...input, minHeight: 90 }} value={nContent} onChange={(e) => setNContent(e.target.value)} />
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13 }}>
          <input type="checkbox" checked={nConsent} onChange={(e) => setNConsent(e.target.checked)} />
          <span>{"Ce couple m'a donn\u00e9 son accord pour publier ce t\u00e9moignage, avec ses propres mots."}</span>
        </label>
        <button type="button" disabled={busy || !nConsent} onClick={addNew} style={{ ...btn("#C05638"), opacity: nConsent ? 1 : 0.5 }}>
          {"Publier"}
        </button>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700 }}>{"Tous les t\u00e9moignages (" + items.length + ")"}</h2>
      {items.map((i) => (
        <div key={i.id} style={box}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#78716c" }}>
            <span>{STATUS_LABEL[i.status] || i.status}</span>
            <span>{"#" + i.id}</span>
          </div>
          <label style={lab}>{"Nom"}<input style={input} value={i.couple_name} onChange={(e) => patchLocal(i.id, { couple_name: e.target.value })} /></label>
          <label style={lab}>{"Ville"}<input style={input} value={i.city || ""} onChange={(e) => patchLocal(i.id, { city: e.target.value })} /></label>
          <label style={lab}>
            {"Note"}
            <select style={input} value={i.rating} onChange={(e) => patchLocal(i.id, { rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n + " sur 5"}</option>
              ))}
            </select>
          </label>
          <label style={lab}>{"Texte"}<textarea style={{ ...input, minHeight: 80 }} value={i.content} onChange={(e) => patchLocal(i.id, { content: e.target.value })} /></label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" disabled={busy} style={btn("#2563eb")} onClick={() => call("PATCH", "/api/admin/testimonials", { id: i.id, action: "edit", coupleName: i.couple_name, city: i.city || "", rating: i.rating, content: i.content }, "Modifications enregistr\u00e9es \u2714")}>
              {"Enregistrer"}
            </button>
            {i.status !== "approved" && (
              <button type="button" disabled={busy} style={btn("#16a34a")} onClick={() => call("PATCH", "/api/admin/testimonials", { id: i.id, action: "approve" }, "Publi\u00e9 \u2714")}>
                {"Approuver"}
              </button>
            )}
            {i.status !== "rejected" && (
              <button type="button" disabled={busy} style={btn("#6b7280")} onClick={() => call("PATCH", "/api/admin/testimonials", { id: i.id, action: "reject" }, "Refus\u00e9")}>
                {"Refuser"}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              style={btn("#dc2626")}
              onClick={() => {
                if (window.confirm("Supprimer d\u00e9finitivement ce t\u00e9moignage ?")) void call("DELETE", "/api/admin/testimonials?id=" + i.id, null, "Supprim\u00e9");
              }}
            >
              {"Supprimer"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}