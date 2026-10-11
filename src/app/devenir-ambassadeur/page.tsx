import LegalPage from "@/components/LegalPage";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getSupportWhatsapp } from "@/lib/wma-settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Devenir ambassadeur" };

async function commission(): Promise<number> {
  try {
    const res = await db.execute(sql`select value from site_settings where key = 'commission_rate' limit 1`);
    const rows = (Array.isArray(res) ? res : ((res as { rows?: Array<Record<string, unknown>> }).rows ?? [])) as Array<Record<string, unknown>>;
    const n = Number(rows[0]?.value);
    return Number.isFinite(n) && n > 0 ? n : 15;
  } catch {
    return 15;
  }
}

export default async function DevenirAmbassadeurPage() {
  const [rate, wa] = await Promise.all([commission(), getSupportWhatsapp()]);
  const href = "https://wa.me/" + wa.digits + "?text=" + encodeURIComponent("Bonjour, je souhaite devenir ambassadeur Wedding Mood.");
  const item = { margin: "8px 0", lineHeight: 1.6 } as const;
  return (
    <LegalPage title={"Devenir ambassadeur Wedding Mood"}>
      <p style={item}>{"Vous accompagnez des couples : organisateur de mariage, photographe, DJ, traiteur, d\u00e9corateur, responsable de jeunes ou membre d'\u00e9glise. Recommandez Wedding Mood et soyez r\u00e9mun\u00e9r\u00e9 pour chaque couple qui s'abonne gr\u00e2ce \u00e0 vous."}</p>
      <ul style={{ margin: "16px 0", paddingLeft: 20, lineHeight: 1.7 }}>
        <li>{"Une commission de " + rate + " % sur chaque abonnement r\u00e9gl\u00e9 par un couple venu avec votre lien."}</li>
        <li>{"Un lien personnel et une carte \u00ab Ambassadeur officiel \u00bb avec votre photo, \u00e0 partager sur WhatsApp, Facebook ou TikTok."}</li>
        <li>{"Un espace pour suivre vos clics, vos clients et votre solde."}</li>
        <li>{"Un paiement par mobile money, selon le jour et le seuil convenus avec l'\u00e9quipe."}</li>
      </ul>
      <p style={item}>{"Pour candidater, \u00e9crivez-nous sur WhatsApp : l'\u00e9quipe cr\u00e9e votre compte et vous envoie votre code et votre PIN."}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-track="click_ambassador_apply"
        style={{ display: "inline-block", marginTop: 12, padding: "14px 20px", borderRadius: 16, background: "var(--wm-primary, #C05638)", color: "#fff", fontWeight: 800, textDecoration: "none" }}
      >
        {"Candidater sur WhatsApp"}
      </a>
    </LegalPage>
  );
}