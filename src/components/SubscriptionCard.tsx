"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Payment = { status?: string | null; amount?: number | null; planType?: string | null };
type Info = {
  coupleStatus: string;
  planType: string;
  planAmount: number;
  isTrialActive: boolean;
  hoursLeftTrial: number;
  payments: Payment[];
};

const PLAN_LABELS: Record<string, string> = {
  individual: "Individuelle",
  couple: "Couple",
  standard_couple: "Couple Standard",
  premium_couple: "Couple Premium",
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: "en attente de v\u00e9rification",
  verified: "valid\u00e9",
  rejected: "refus\u00e9",
  need_new_proof: "preuve \u00e0 renvoyer",
};

export default function SubscriptionCard() {
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    fetch("/api/payments", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.success) setInfo(d as Info);
      })
      .catch(() => {});
  }, []);

  if (!info) return null;

  const plan = PLAN_LABELS[info.planType] || "Couple";
  const last = info.payments && info.payments.length > 0 ? info.payments[0] : null;
  const isActive = info.coupleStatus === "active";
  const isPremium = info.planType === "premium_couple";
  const daysLeft = Math.max(0, Math.ceil((info.hoursLeftTrial || 0) / 24));

  let statusLine = "";
  if (isActive) statusLine = "Abonnement actif : formule " + plan;
  else if (info.coupleStatus === "verification" || info.coupleStatus === "pending_payment") statusLine = "Paiement en cours de v\u00e9rification par notre \u00e9quipe";
  else if (info.isTrialActive) statusLine = "Essai gratuit : " + daysLeft + " jour" + (daysLeft > 1 ? "s" : "") + " restant" + (daysLeft > 1 ? "s" : "");
  else statusLine = "Essai termin\u00e9 : choisissez une formule pour continuer";

  const btn = { padding: "10px 14px", borderRadius: 12, fontWeight: 700, fontSize: 13, textAlign: "center" } as const;

  return (
    <div style={{ padding: 16, border: "1px solid #D4AF37", borderRadius: 16, background: "#FFFBEB", display: "grid", gap: 10, marginBottom: 16 }}>
      <strong style={{ fontSize: 16 }}>{"Mon abonnement"}</strong>
      <div style={{ fontSize: 14, color: "#292524" }}>{statusLine}</div>
      {last && (
        <div style={{ fontSize: 12, color: "#57534e" }}>
          {"Dernier paiement : " + Number(last.amount || 0).toLocaleString("fr-FR") + " FCFA, " + (PAYMENT_LABELS[String(last.status)] || String(last.status || ""))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link href="/dashboard/subscription" style={{ ...btn, background: "#C05638", color: "#fff" }}>
          {"Voir mon abonnement"}
        </Link>
        {!isPremium && (
          <Link href="/abonnement" style={{ ...btn, background: "#fff", color: "#C05638", border: "1px solid #C05638" }}>
            {isActive ? "Passer \u00e0 Premium" : "Voir les offres"}
          </Link>
        )}
        {!(isActive && isPremium) && (
          <Link href="/confirmation-paiement" style={{ ...btn, background: "#fff", color: "#57534e", border: "1px solid #d6d3d1" }}>
            {"J'ai pay\u00e9 : confirmer"}
          </Link>
        )}
      </div>
    </div>
  );
}