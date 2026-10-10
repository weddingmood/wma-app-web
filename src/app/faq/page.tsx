import LegalPage from "@/components/LegalPage";
import { readSettings } from "@/lib/wma-settings";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const s = await readSettings(["faq"]);
  let items: Array<{ q: string; a: string }> = [];
  try { items = JSON.parse(s.faq || "[]"); } catch { items = []; }
  return (
    <LegalPage title={"Questions fr\u00e9quentes"}>
      {items.length === 0 && <p>{"Les r\u00e9ponses seront bient\u00f4t disponibles."}</p>}
      {items.map((it, i) => (
        <details key={i} style={{ borderBottom: "1px solid var(--wm-line, #e7e5e4)", padding: "12px 0" }}>
          <summary style={{ fontWeight: 700, cursor: "pointer" }}>{it.q}</summary>
          <p style={{ marginTop: 8, whiteSpace: "pre-wrap", color: "var(--wm-text-soft, #57534e)" }}>{it.a}</p>
        </details>
      ))}
    </LegalPage>
  );
}