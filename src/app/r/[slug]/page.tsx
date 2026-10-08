import { notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import AmbassadorClickTracker from "@/components/AmbassadorClickTracker";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export default async function AmbassadorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const safe = slug.toLowerCase().slice(0, 60);

  let amb: Row | null = null;
  try {
    const res = await db.execute(sql`
      select a.name, a.city, a.bio, a.photo_url, a.referral_slug, c.name as country_name, c.flag
      from ambassadors a left join countries c on c.slug = a.country_slug
      where a.referral_slug = ${safe} and a.is_active = true
      limit 1
    `);
    const rows = (Array.isArray(res) ? res : ((res as { rows?: Row[] }).rows ?? [])) as Row[];
    amb = rows[0] ?? null;
  } catch {
    amb = null;
  }
  if (!amb) notFound();

  const name = String(amb.name);
  const place = (amb.flag ? String(amb.flag) + " " : "") + (amb.city ? String(amb.city) : "") + (amb.country_name ? ", " + String(amb.country_name) : "");
  const btn = { padding: "14px 18px", borderRadius: 16, fontWeight: 800, fontSize: 15, textAlign: "center", display: "block" } as const;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px 64px", display: "grid", gap: 20, justifyItems: "center", textAlign: "center" }}>
      <AmbassadorClickTracker slug={safe} />
      {amb.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={String(amb.photo_url)} alt={name} style={{ width: 180, height: 180, borderRadius: 999, objectFit: "cover", border: "4px solid #D4AF37" }} />
      ) : (
        <div style={{ width: 180, height: 180, borderRadius: 999, background: "#f5f5f4", border: "4px solid #D4AF37" }} />
      )}
      <div style={{ display: "grid", gap: 6 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>{name}</h1>
        <span style={{ fontSize: 14, color: "#78716c" }}>{place}</span>
      </div>
      {amb.bio ? <p style={{ fontSize: 15, lineHeight: 1.6, color: "#292524" }}>{String(amb.bio)}</p> : null}
      <p style={{ fontSize: 14, color: "#57534e" }}>
        {name + " vous invite \u00e0 pr\u00e9parer votre mariage avec Wedding Mood : budget, invit\u00e9s, prestataires et jeux, \u00e0 deux."}
      </p>
      <div style={{ display: "grid", gap: 10, width: "100%" }}>
        <Link href="/" style={{ ...btn, background: "#C05638", color: "#fff" }}>
          {"Essayer gratuitement 3 jours"}
        </Link>
        <Link href="/abonnement" style={{ ...btn, background: "#fff", color: "#C05638", border: "1px solid #C05638" }}>
          {"Voir les offres"}
        </Link>
      </div>
    </main>
  );
}