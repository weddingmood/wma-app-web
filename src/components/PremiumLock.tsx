"use client";

import Link from "next/link";

const UPGRADE_URL = "https://pay.wave.com/m/M_W9fOyOGfFiNN/c/ci/?amount=2000";

export default function PremiumLock({ feature, compact = false }: { feature: string; compact?: boolean }) {
  const btn = { padding: "9px 14px", borderRadius: 12, fontWeight: 700, fontSize: 13, textAlign: "center" } as const;
  return (
    <div
      style={{
        padding: compact ? 14 : 24,
        border: "1px solid #D4AF37",
        borderRadius: 16,
        background: "#FFFBEB",
        display: "grid",
        gap: 8,
        textAlign: compact ? "left" : "center",
      }}
    >
      <strong style={{ fontSize: compact ? 15 : 20 }}>{"Contenu Premium"}</strong>
      <p style={{ fontSize: 13, color: "#57534e" }}>
        {"D\u00e9bloquez " + feature + " pour 2 000 F de plus. L'offre Premium (5 000 F) donne acc\u00e8s aux traiteurs, \u00e0 tous les jeux et aux livres."}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: compact ? "flex-start" : "center" }}>
        <a href={UPGRADE_URL} target="_blank" rel="noopener noreferrer" style={{ ...btn, background: "#2563eb", color: "#fff" }}>
          {"Payer 2 000 F sur Wave"}
        </a>
        <Link href="/dashboard/subscription" style={{ ...btn, background: "#fff", color: "#C05638", border: "1px solid #C05638" }}>
          {"J'ai pay\u00e9 : confirmer"}
        </Link>
      </div>
    </div>
  );
}