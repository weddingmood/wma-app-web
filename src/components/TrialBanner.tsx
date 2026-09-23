"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import { AlertTriangle } from "lucide-react";

/**
 * Bannière affichée quand l'essai gratuit du couple est termine.
 * Reproduit exactement la meme logique que refuserSiEssaiExpire (src/lib/access-guard.ts)
 * pour toujours correspondre a ce qui est reellement bloque cote serveur.
 */
export default function TrialBanner() {
  const { couple } = useTheme();

  if (!couple) return null;

  const enEssai = couple.status === "trial" || couple.status === "pending_payment";
  const essaiDepasse = couple.trialEndsAt ? new Date(couple.trialEndsAt) <= new Date() : false;

  if (!enEssai || !essaiDepasse) return null;

  return (
    <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
      <div className="flex items-start gap-2 flex-1">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-stone-900">Votre essai gratuit est terminé</p>
          <p className="text-xs text-stone-600 mt-0.5">
            Vous pouvez toujours consulter votre espace, mais pour continuer à le modifier
            (tâches, invités, budget, carte d'invitation...), réglez votre abonnement.
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link
          href="/dashboard/subscription"
          className="px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold transition text-center whitespace-nowrap"
        >
          Régler mon abonnement
        </Link>
      </div>
    </div>
  );
}