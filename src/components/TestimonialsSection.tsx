"use client";

import { useEffect, useState } from "react";

type Item = { id: number; couple_name: string; city: string | null; wedding_date: string | null; content: string; rating: number };

export default function TestimonialsSection({ hideWhenEmpty = false }: { hideWhenEmpty?: boolean }) {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    fetch("/api/testimonials", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.testimonials) ? (d.testimonials as Item[]) : []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) return null;
  if (items.length === 0 && hideWhenEmpty) return null;

  const stars = (n: number) => "\u2605".repeat(Math.max(0, Math.min(5, n))) + "\u2606".repeat(5 - Math.max(0, Math.min(5, n)));

  return (
    <section style={{ display: "grid", gap: 14, padding: "8px 0" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center" }}>
        {items.length > 0 ? "Ils ont pr\u00e9par\u00e9 leur mariage avec Wedding Mood" : "Votre avis compte"}
      </h2>

      {items.length === 0 ? (
        <div style={{ padding: 18, border: "1px dashed #C05638", borderRadius: 16, background: "#FFF7ED", textAlign: "center", fontSize: 14, color: "#57534e" }}>
          {"Soyez parmi les premiers couples \u00e0 partager votre exp\u00e9rience. Vos t\u00e9moignages s'afficheront ici apr\u00e8s validation par notre \u00e9quipe."}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 8 }}>
            {items.map((t) => (
              <figure
                key={t.id}
                style={{ margin: 0, minWidth: 260, maxWidth: 340, flex: "0 0 auto", scrollSnapAlign: "start", padding: 16, border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", display: "grid", gap: 8, alignContent: "start" }}
              >
                <div style={{ color: "#D4AF37", fontSize: 18, letterSpacing: 2 }} aria-label={t.rating + " sur 5"}>
                  {stars(t.rating)}
                </div>
                <blockquote style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#292524" }}>{"\u00ab " + t.content + " \u00bb"}</blockquote>
                <figcaption style={{ fontSize: 12, color: "#78716c" }}>
                  <strong style={{ color: "#1c1917" }}>{t.couple_name}</strong>
                  {t.city ? " \u2013 " + t.city : ""}
                  {t.wedding_date ? " \u2013 Mariage " + t.wedding_date : ""}
                </figcaption>
              </figure>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#78716c", textAlign: "center" }}>
            {"T\u00e9moignages de couples, v\u00e9rifi\u00e9s par notre \u00e9quipe."}
          </p>
        </>
      )}
    </section>
  );
}