"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { name: string; city: string | null; bio: string | null; photo_url: string | null; referral_slug: string; country_name: string | null; flag: string | null };

export default function FeaturedAmbassadors() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    fetch("/api/ambassadors/featured", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.ambassadors) ? (d.ambassadors as Item[]) : []))
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: "center" }}>{"Nos ambassadeurs"}</h2>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {items.map((a) => (
          <Link
            key={a.referral_slug}
            href={"/r/" + a.referral_slug}
            style={{ padding: 16, border: "1px solid #e7e5e4", borderRadius: 18, background: "#fff", display: "grid", gap: 8, justifyItems: "center", textAlign: "center" }}
          >
            {a.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.photo_url} alt="" style={{ width: 88, height: 88, borderRadius: 999, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 88, height: 88, borderRadius: 999, background: "#f5f5f4" }} />
            )}
            <strong>{a.name}</strong>
            <span style={{ fontSize: 12, color: "#78716c" }}>{(a.flag ? a.flag + " " : "") + (a.city || "") + (a.country_name ? ", " + a.country_name : "")}</span>
            {a.bio && <span style={{ fontSize: 13, color: "#44403c" }}>{a.bio.length > 140 ? a.bio.slice(0, 140) + "\u2026" : a.bio}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}