"use client";

import { useEffect, useState } from "react";

const GAMES = [
  { slug: "ludo", label: "Ludo" },
  { slug: "awale", label: "Awalé" },
  { slug: "dames", label: "Dames" },
  { slug: "mots", label: "Défi des Mots" },
];

export default function GameVisibilityAdmin() {
  const [hidden, setHidden] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/games/visibility", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => Array.isArray(d.hidden) && setHidden(d.hidden))
      .catch(() => setError("Chargement impossible."));
  }, []);

  const toggle = async (slug: string) => {
    const makeVisible = hidden.includes(slug);
    const previous = hidden;
    setHidden(makeVisible ? hidden.filter((s) => s !== slug) : [...hidden, slug]);
    setBusy(slug);
    setError(null);
    try {
      const res = await fetch("/api/games/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, isVisible: makeVisible }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Échec");
    } catch (e) {
      setHidden(previous);
      setError(e instanceof Error ? e.message : "Échec de la mise à jour.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {GAMES.map((g) => {
        const isHidden = hidden.includes(g.slug);
        return (
          <div
            key={g.slug}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          >
            <span>{g.label}</span>
            <button
              type="button"
              disabled={busy === g.slug}
              onClick={() => toggle(g.slug)}
              style={{ padding: "6px 12px", borderRadius: 6, border: 0, color: "#fff", background: isHidden ? "#6b7280" : "#16a34a", cursor: "pointer" }}
            >
              {isHidden ? "Masqué" : "Visible"}
            </button>
          </div>
        );
      })}
      {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
    </div>
  );
}