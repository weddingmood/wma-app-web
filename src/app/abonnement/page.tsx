import Link from "next/link";
import { Check, X } from "lucide-react";
import { OFFERS, COMPARISON, UPGRADE_OFFER } from "@/lib/offers";

export const metadata = { title: "Abonnements | Wedding Mood" };

const fmt = (n: number) => n.toLocaleString("fr-FR");
function Mark({ on, highlight }: { on: boolean; highlight: boolean }) {
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 999 } as const;
  return on ? (
    <span role="img" aria-label="Inclus" style={{ ...base, background: highlight ? "#C05638" : "#16a34a", boxShadow: highlight ? "0 2px 8px rgba(192,86,56,0.35)" : "none" }}>
      <Check size={15} color="#ffffff" strokeWidth={3} />
    </span>
  ) : (
    <span role="img" aria-label="Non inclus" style={{ ...base, background: "#f5f5f4" }}>
      <X size={14} color="#a8a29e" strokeWidth={2.5} />
    </span>
  );
}

export default function AbonnementPage() {
  const btn = { padding: "12px 14px", borderRadius: 14, fontWeight: 800, fontSize: 14, textAlign: "center", display: "block" } as const;

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px 64px", display: "grid", gap: 28 }}>
      <header style={{ textAlign: "center", display: "grid", gap: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>{"Choisissez votre formule"}</h1>
        <p style={{ fontSize: 14, color: "#57534e" }}>
          {"3 jours d'essai gratuit, sans engagement. Paiement par Wave, activation de votre pack par notre \u00e9quipe."}
        </p>
      </header>

      <section style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", alignItems: "stretch" }}>
        {OFFERS.map((o) => (
          <div
            key={o.id}
            style={{
              position: "relative",
              padding: 20,
              borderRadius: 20,
              border: o.highlight ? "3px solid #C05638" : "1px solid #e7e5e4",
              background: o.highlight ? "#FFF7ED" : "#fff",
              boxShadow: o.highlight ? "0 12px 30px rgba(192,86,56,0.25)" : "none",
              display: "grid",
              gap: 14,
              alignContent: "space-between",
            }}
          >
            {o.highlight && (
              <span style={{ position: "absolute", top: -12, left: 20, background: "#C05638", color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999 }}>
                {"RECOMMAND\u00c9E"}
              </span>
            )}
            <div style={{ display: "grid", gap: 6 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>{o.name}</h2>
              <div style={{ fontSize: 34, fontWeight: 900 }}>
                {fmt(o.amount)} <small style={{ fontSize: 14, fontWeight: 600, color: "#78716c" }}>{"FCFA"}</small>
              </div>
              <p style={{ fontSize: 13, color: "#57534e" }}>{o.tagline}</p>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <a
                href={o.payUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...btn, background: o.highlight ? "#C05638" : "#2563eb", color: "#fff" }}
              >
                {"Payer " + fmt(o.amount) + " FCFA sur Wave"}
              </a>
              <Link
                href={"/confirmation-paiement?pack=" + o.id}
                style={{ ...btn, background: "#fff", color: "#C05638", border: "1px solid #C05638" }}
              >
                {"J'ai pay\u00e9 : confirmer mon paiement"}
              </Link>
            </div>
          </div>
        ))}
      </section>

      <section style={{ overflowX: "auto", border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520, fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 12 }}>{"Fonctionnalit\u00e9s"}</th>
              {OFFERS.map((o) => (
                <th key={o.id} style={{ padding: 12, background: o.highlight ? "#FFF7ED" : "transparent", color: o.highlight ? "#C05638" : "inherit" }}>
                  {o.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr key={row.label} style={{ borderTop: "1px solid #f5f5f4" }}>
                <td style={{ padding: 12 }}>{row.label}</td>
                {row.values.map((v, i) => (
                  <td key={i} style={{ padding: 12, textAlign: "center", background: OFFERS[i].highlight ? "#FFF7ED" : "transparent" }}>
                    <Mark on={v} highlight={OFFERS[i].highlight} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ padding: 18, borderRadius: 16, border: "1px solid #D4AF37", background: "#FFFBEB", display: "grid", gap: 8 }}>
        <strong>{"D\u00e9j\u00e0 en formule Couple Standard ?"}</strong>
        <span style={{ fontSize: 13, color: "#57534e" }}>
          {"Passez \u00e0 Premium pour " + fmt(UPGRADE_OFFER.amount) + " FCFA de plus : traiteurs, livres et support prioritaire."}
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href={UPGRADE_OFFER.payUrl} target="_blank" rel="noopener noreferrer" style={{ ...btn, background: "#2563eb", color: "#fff" }}>
            {"Payer le compl\u00e9ment de 2 000 FCFA"}
          </a>
          <Link href="/confirmation-paiement?pack=upgrade_premium" style={{ ...btn, background: "#fff", color: "#C05638", border: "1px solid #C05638" }}>
            {"J'ai pay\u00e9 : confirmer"}
          </Link>
        </div>
      </section>

      <section style={{ display: "grid", gap: 6, fontSize: 13, color: "#57534e" }}>
        <strong style={{ color: "#1c1917" }}>{"Comment \u00e7a marche"}</strong>
        <span>{"1. Payez sur Wave avec le bouton de votre formule."}</span>
        <span>{"2. Revenez ici et appuyez sur \u00ab J'ai pay\u00e9 \u00bb : indiquez votre identifiant de transaction Wave."}</span>
        <span>{"3. Notre \u00e9quipe v\u00e9rifie votre paiement et active votre pack."}</span>
      </section>
    </main>
  );
}