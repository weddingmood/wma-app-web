"use client";

import { useEffect, useState } from "react";

type Info = { eligible: boolean; alreadySent: boolean; defaultName: string; defaultCity: string };

export default function TemoignagePage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [info, setInfo] = useState<Info | null>(null);
  const [coupleName, setCoupleName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch("/api/testimonials?mine=1", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          setLoggedIn(false);
          return;
        }
        const d = await res.json().catch(() => null);
        if (d && d.success) {
          setInfo(d as Info);
          setCoupleName(d.defaultName || "");
          setCity(d.defaultCity || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupleName, city, rating, content }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) setSent(true);
      else setError((data && data.message) || "Envoi impossible. R\u00e9essayez dans un instant.");
    } catch {
      setError("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
  };

  const box = { padding: 18, border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", display: "grid", gap: 12 } as const;
  const input = { width: "100%", padding: "9px 11px", border: "1px solid #d6d3d1", borderRadius: 10, fontSize: 14 } as const;
  const lab = { fontSize: 12, fontWeight: 700, display: "grid", gap: 4 } as const;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gap: 16, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>{"Mon t\u00e9moignage"}</h1>

      {loading && <p>{"Chargement\u2026"}</p>}
      {!loading && !loggedIn && <div style={box}>{"Connectez-vous \u00e0 votre espace pour laisser un t\u00e9moignage."}</div>}

      {!loading && loggedIn && info && !info.eligible && !info.alreadySent && !sent && (
        <div style={box}>
          <strong>{"Bient\u00f4t disponible"}</strong>
          <span style={{ fontSize: 14, color: "#57534e" }}>
            {"Vous pourrez partager votre exp\u00e9rience 7 jours apr\u00e8s la validation de votre abonnement."}
          </span>
        </div>
      )}

      {!loading && loggedIn && (sent || (info && info.alreadySent)) && (
        <div style={box}>
          <strong>{"Merci pour votre t\u00e9moignage !"}</strong>
          <span style={{ fontSize: 14, color: "#57534e" }}>
            {"Notre \u00e9quipe le relit avant de le publier. Il appara\u00eetra ensuite sur la page des offres."}
          </span>
        </div>
      )}

      {!loading && loggedIn && info && info.eligible && !info.alreadySent && !sent && (
        <div style={box}>
          <label style={lab}>
            {"Votre nom (tel qu'il sera affich\u00e9)"}
            <input style={input} value={coupleName} onChange={(e) => setCoupleName(e.target.value)} />
          </label>
          <label style={lab}>
            {"Ville"}
            <input style={input} value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <div style={lab}>
            {"Votre note"}
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={n + " sur 5"}
                  style={{ fontSize: 28, border: 0, background: "transparent", cursor: "pointer", color: n <= rating ? "#D4AF37" : "#d6d3d1" }}
                >
                  {"\u2605"}
                </button>
              ))}
            </div>
          </div>
          <label style={lab}>
            {"Votre t\u00e9moignage (20 \u00e0 600 caract\u00e8res)"}
            <textarea style={{ ...input, minHeight: 120 }} value={content} onChange={(e) => setContent(e.target.value)} />
            <span style={{ fontWeight: 400, color: "#78716c" }}>{content.trim().length + " / 600"}</span>
          </label>
          {error && <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            style={{ padding: "12px 14px", borderRadius: 14, fontWeight: 800, fontSize: 14, border: 0, color: "#fff", background: "#C05638", cursor: "pointer" }}
          >
            {busy ? "Envoi\u2026" : "Envoyer mon t\u00e9moignage"}
          </button>
        </div>
      )}
    </div>
  );
}