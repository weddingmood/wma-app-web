import LegalPage from "@/components/LegalPage";
import { readSettings } from "@/lib/wma-settings";

export const dynamic = "force-dynamic";

export default async function ConfidentialitePage() {
  const s = await readSettings(["privacy"]);
  return (
    <LegalPage title={"Politique de confidentialit\u00e9"}>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{s.privacy || "Ce texte sera bient\u00f4t disponible."}</div>
    </LegalPage>
  );
}