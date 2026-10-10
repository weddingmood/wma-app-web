import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import AmbassadorClickTracker from "@/components/AmbassadorClickTracker";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

async function loadAmbassador(safe: string): Promise<Row | null> {
  try {
    const res = await db.execute(sql`
      select a.name, a.city, a.bio, a.photo_url, a.referral_slug, c.name as country_name, c.flag
      from ambassadors a left join countries c on c.slug = a.country_slug
      where a.referral_slug = ${safe} and a.is_active = true
      limit 1
    `);
    const rows = (Array.isArray(res) ? res : ((res as { rows?: Row[] }).rows ?? [])) as Row[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const amb = await loadAmbassador(slug.toLowerCase().slice(0, 60));
  if (!amb) return { title: "Ambassadeur" };
  const name = String(amb.name);
  const title = name + ", Ambassadeur officiel";
  const description = name + " vous invite \u00e0 pr\u00e9parer votre mariage avec Wedding Mood : budget, invit\u00e9s, prestataires et jeux, \u00e0 deux. Essai gratuit de 3 jours.";
  const images = amb.photo_url ? [{ url: String(amb.photo_url), alt: name }] : undefined;
  return {
    title,
    description,
    openGraph: { title: title + " Wedding Mood", description, type: "website", images },
    twitter: { card: "summary", title: title + " Wedding Mood", description, images: images ? [String(amb.photo_url)] : undefined },
  };
}

export default async function AmbassadorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const safe = slug.toLowerCase().slice(0, 60);
  const amb = await loadAmbassador(safe);
  if (!amb) notFound();

  const name = String(amb.name);
  const place = (amb.flag ? String(amb.flag) + " " : "") + (amb.city ? String(amb.city) : "") + (amb.country_name ? ", " + String(amb.country_name) : "");
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const btn = { padding: "14px 18px", borderRadius: 16, fontWeight: 800, fontSize: 15, textAlign: "center", display: "block" } as const;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px 64px", display: "grid", gap: 20, justifyItems: "center", textAlign: "center" }}>
      <AmbassadorClickTracker slug={safe} />
      <Logo size={36} showText={true} variant="dark" />
      <span style={{ padding: "5px 14px", borderRadius: 999, background: "var(--wm-accent-gold)", color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>
        {"AMBASSADEUR OFFICIEL"}
      </span>
      {amb.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={String(amb.photo_url)} alt={name} style={{ width: 180, height: 180, borderRadius: 999, objectFit: "cover", border: "4px solid var(--wm-accent-gold)" }} />
      ) : (
        <div style={{ width: 180, height: 180, borderRadius: 999, background: "var(--wm-primary)", color: "#fff", display: "grid", placeItems: "center", fontSize: 56, fontWeight: 800, border: "4px solid var(--wm-accent-gold)" }}>{initials}</div>
      )}
      <div style={{ display: "grid", gap: 6 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>{name}</h1>
        <span style={{ fontSize: 14, color: "var(--wm-text-faint)" }}>{place}</span>
      </div>
      {amb.bio ? <p style={{ fontSize: 15, lineHeight: 1.6, color: "#292524" }}>{String(amb.bio)}</p> : null}
      <p style={{ fontSize: 14, color: "var(--wm-text-soft)" }}>
        {name + " vous invite \u00e0 pr\u00e9parer votre mariage avec Wedding Mood : budget, invit\u00e9s, prestataires et jeux, \u00e0 deux."}
      </p>
      <div style={{ display: "grid", gap: 10, width: "100%" }}>
        <Link href="/" style={{ ...btn, background: "var(--wm-primary)", color: "#fff" }}>
          {"Essayer gratuitement 3 jours"}
        </Link>
        <Link href="/abonnement" style={{ ...btn, background: "#fff", color: "var(--wm-primary)", border: "1px solid var(--wm-primary)" }}>
          {"Voir les offres"}
        </Link>
      </div>
    </main>
  );
}