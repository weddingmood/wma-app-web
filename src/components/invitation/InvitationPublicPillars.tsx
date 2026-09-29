"use client";

import CeremoniesTimeline from "@/components/invitation/CeremoniesTimeline";
import GiftPanel from "@/components/invitation/GiftPanel";
import GamesPanel from "@/components/invitation/GamesPanel";
import { encadrePaiement } from "@/lib/paiements";

type Props = {
  slug: string;
  country?: { code?: string; nom?: string } | null;
  ceremonies?: { pays?: { code?: string; nom?: string } | null; etapes?: any[] } | null;
  cagnotte?: any;
  animations?: any;
  operateurs?: any;
  couple?: { partenaire1?: string; partenaire2?: string } | null;
};

export default function InvitationPublicPillars({ slug, country, ceremonies, cagnotte, animations, operateurs, couple }: Props) {
  const code = country?.code || ceremonies?.pays?.code || "CI";
  const paymentOptions = operateurs || encadrePaiement(code);
  const etapes = Array.isArray(ceremonies?.etapes) ? ceremonies?.etapes : [];
  const questions = Array.isArray(animations?.quiz) ? animations.quiz : [];
  const devinettes = Array.isArray(animations?.devinettes) ? animations.devinettes : [];

  return (
    <div className="space-y-6 bg-[#FCFAF7] px-4 py-10 sm:px-6 sm:py-16">
      <CeremoniesTimeline etapes={etapes} pays={ceremonies?.pays || country} />
      <GiftPanel slug={slug} cagnotte={cagnotte || null} operateurs={paymentOptions} />
      <GamesPanel
        slug={slug}
        couple={{ partenaire1: couple?.partenaire1, partenaire2: couple?.partenaire2 }}
        questions={questions}
        devinettes={devinettes}
        disponibles={Boolean(animations?.disponibles)}
        message={animations?.disponibles ? undefined : "Les animations de cette invitation sont réservées au palier actif du couple."}
      />
    </div>
  );
}
