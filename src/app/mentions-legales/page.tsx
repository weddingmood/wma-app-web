import LegalPage from "@/components/LegalPage";
import { PUBLIC_KEYS, readSettings } from "@/lib/wma-settings";

export const dynamic = "force-dynamic";

export default async function MentionsPage() {
  const s = await readSettings(PUBLIC_KEYS);
  const rows: Array<[string, string]> = [
    ["Entreprise", s.company_name],
    ["DFE", s.dfe],
    ["RCCM", s.rccm],
    ["Adresse", s.address],
    ["T\u00e9l\u00e9phone", s.phone],
    ["WhatsApp", s.whatsapp],
    ["E-mail de contact", s.email_contact],
    ["E-mail du support", s.email_support],
  ];
  return (
    <LegalPage title={"Mentions l\u00e9gales"}>
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <p key={k} style={{ margin: "6px 0" }}><strong>{k + " : "}</strong>{v}</p>
      ))}
      {s.footer_signature && <p style={{ marginTop: 20, whiteSpace: "pre-wrap", color: "var(--wm-text-soft, #57534e)" }}>{s.footer_signature}</p>}
    </LegalPage>
  );
}