import LegalPage from "@/components/LegalPage";
import { DOCS, fill } from "@/lib/legal-content";
import type { DocKey } from "@/lib/legal-content";
import { TERMS_DATE_LABEL } from "@/lib/legal-version";

const para = { margin: "8px 0", lineHeight: 1.7 } as const;

function Lines({ lines }: { lines: string[] }) {
  const nodes: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length === 0) return;
    const items = list;
    nodes.push(
      <ul key={"u" + nodes.length} style={{ margin: "8px 0", paddingLeft: 20, lineHeight: 1.7 }}>
        {items.map((x, i) => (<li key={i}>{x}</li>))}
      </ul>
    );
    list = [];
  };
  lines.forEach((l, i) => {
    if (l.startsWith("- ")) list.push(l.slice(2));
    else { flush(); nodes.push(<p key={"p" + i} style={para}>{l}</p>); }
  });
  flush();
  return <>{nodes}</>;
}

export default function LegalDocument({ doc, vars, override }: { doc: DocKey; vars: Record<string, string>; override: { terms: string; privacy: string } }) {
  const d = DOCS[doc];
  const custom = doc === "cgu" ? override.terms : doc === "confidentialite" ? override.privacy : "";
  const clean = (arr: string[]) => arr.map((t) => fill(t, vars)).filter((t): t is string => t !== null);

  return (
    <LegalPage title={d.title}>
      <p style={{ ...para, color: "var(--wm-text-faint, #78716c)", fontSize: 13 }}>{"Version du " + TERMS_DATE_LABEL}</p>
      {custom ? (
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{custom}</div>
      ) : (
        <>
          <Lines lines={clean([d.intro])} />
          {d.sections.map((s, i) => {
            const lines = clean(s.body);
            if (lines.length === 0) return null;
            return (
              <section key={s.title} style={{ marginTop: 22 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>{(i + 1) + ". " + s.title}</h2>
                <Lines lines={lines} />
              </section>
            );
          })}
        </>
      )}
    </LegalPage>
  );
}