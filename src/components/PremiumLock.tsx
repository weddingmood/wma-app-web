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
        {"Pour acc\u00e9der \u00e0 " + feature + ", passez \u00e0 l'offre Premium (5 000 F) : traiteurs, tous les jeux et livres. Avec la formule Couple Standard, un compl\u00e9ment de 2 000 F suffit."}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: compact ? "flex-start" : "center" }}>
        <Link href="/abonnement" style={{ ...btn, background: "#C05638", color: "#fff" }}>
          {"Voir les offres"}
        </Link>
        <a href={UPGRADE_URL} target="_blank" rel="noopener noreferrer" style={{ ...btn, background: "#2563eb", color: "#fff" }}>
          {"Compl\u00e9ment Standard : 2 000 F"}
        </a>
      </div>
    </div>
  );
}