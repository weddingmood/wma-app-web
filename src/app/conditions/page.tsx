import LegalPage from "@/components/LegalPage";
import { readSettings } from "@/lib/wma-settings";

export const dynamic = "force-dynamic";

export default async function ConditionsPage() {
  const s = await readSettings(["terms"]);
  return (
    <LegalPage title={"Conditions d'utilisation"}>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{s.terms || "Ce texte sera bient\u00f4t disponible."}</div>
    </LegalPage>
  );
}