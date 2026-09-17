"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Heart } from "lucide-react";
import { DigitalInvitationExperience } from "@/components/DigitalInvitationExperience";

export default function PublicInvitationPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [invData, setInvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublicInv() {
      try {
        setLoading(true);
        const res = await fetch(`/api/invitations/${slug}`);
        if (res.ok) {
          const d = await res.json();
          if (d.success) setInvData(d);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchPublicInv();
  }, [slug]);

  const handleRsvpSubmit = async (formData: {
    guestName: string;
    email?: string;
    phone?: string;
    attendanceStatus: "confirmed" | "declined" | "maybe";
    plusOnesCount: number;
    messageForCouple?: string;
    prayerWishes?: string;
  }) => {
    const res = await fetch(`/api/invitations/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const d = await res.json();
    return {
      success: d.success,
      message: d.message,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] text-stone-600 font-serif text-lg">
        Chargement de l'invitation de mariage...
      </div>
    );
  }

  if (!invData?.invitation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] p-6 text-center space-y-3">
        <Heart className="w-12 h-12 text-[#C05638]" />
        <h1 className="font-serif text-2xl font-bold text-stone-900">Invitation Introuvable</h1>
        <p className="text-xs text-stone-500 max-w-sm">
          Cette page d'invitation n'existe pas ou n'est plus accessible.
        </p>
      </div>
    );
  }

  const inv = invData.invitation;
  const couple = invData.couple;

  return (
    <DigitalInvitationExperience
      slug={slug}
      heroTitle={inv.heroTitle || "Invitation au Mariage"}
      subTitle={inv.subTitle || "Nous nous marions"}
      coupleNames={`${couple?.partner1Name || "David"} & ${couple?.partner2Name || "Ruth"}`}
      weddingDate={inv.weddingDate || couple?.weddingDate || "15 Novembre 2025"}
      weddingTime={inv.weddingTime || "10:00"}
      city={couple?.city || "Abidjan"}
      venueName={inv.venueName || couple?.venue || "Espace Nuptial Riviera Golf"}
      venueAddress={inv.venueAddress || couple?.city || "Abidjan, Côte d'Ivoire"}
      venueMapUrl={inv.venueMapUrl || ""}
      customVerse={inv.customVerse || couple?.bibleVerse || "Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement."}
      introText={inv.introText || "Nous avons la joie de vous inviter à célébrer avec nous le début de notre foyer."}
      loveStory={inv.loveStory || ""}
      testimony={inv.testimony || ""}
      pastorWord={inv.pastorWord || ""}
      finalMessage={inv.finalMessage || ""}
      rsvpDeadline={inv.rsvpDeadline || "31 Octobre 2025"}
      hasPhoto={inv.hasPhoto !== undefined ? inv.hasPhoto : true}
      heroImageUrl={inv.heroImageUrl || ""}
      cardTemplate={inv.cardTemplate || "terracotta_or"}
      sansPhotoStyle={inv.sansPhotoStyle || "monogram"}
      photoLayout={inv.photoLayout || "arche"}
      photoZoom={inv.photoZoom || 100}
      photoPositionX={inv.photoPositionX !== undefined ? inv.photoPositionX : 50}
      photoPositionY={inv.photoPositionY !== undefined ? inv.photoPositionY : 50}
      customPrimaryColor={inv.customPrimaryColor || undefined}
      customSecondaryColor={inv.customSecondaryColor || undefined}
      customAccentColor={inv.customAccentColor || undefined}
      customTextColor={inv.customTextColor || undefined}
      customFontFamily={inv.customFontFamily || undefined}
      customFontSize={inv.customFontSize || "md"}
      customTextAlign={inv.customTextAlign || "center"}
      showCountdown={inv.showCountdown !== undefined ? inv.showCountdown : true}
      showStory={inv.showStory !== undefined ? inv.showStory : true}
      showProgramme={inv.showProgramme !== undefined ? inv.showProgramme : true}
      showLocations={inv.showLocations !== undefined ? inv.showLocations : true}
      showVerse={inv.showVerse !== undefined ? inv.showVerse : true}
      showRsvp={inv.showRsvp !== undefined ? inv.showRsvp : true}
      showCagnotte={inv.showCagnotte !== undefined ? inv.showCagnotte : true}
      showQrCode={inv.showQrCode !== undefined ? inv.showQrCode : true}
      cagnotteEnabled={inv.cagnotteEnabled !== undefined ? inv.cagnotteEnabled : true}
      cagnotteTitle={inv.cagnotteTitle || "Cagnotte Foyer & Premier Loyer"}
      cagnotteDescription={inv.cagnotteDescription || undefined}
      cagnottePaymentMethod={inv.cagnottePaymentMethod || "wave"}
      cagnottePaymentUrl={inv.cagnottePaymentUrl || undefined}
      cagnotteButtonText={inv.cagnotteButtonText || "Contribuer au foyer"}
      ceremoniesSelected={
        Array.isArray(inv.ceremoniesSelected) && inv.ceremoniesSelected.length > 0
          ? inv.ceremoniesSelected
          : ["dot", "civil", "church", "reception"]
      }
      ceremoniesDetails={inv.ceremoniesDetails || undefined}
      dotDate={inv.dotDate || ""}
      civilDate={inv.civilDate || ""}
      churchDate={inv.churchDate || ""}
      receptionDate={inv.receptionDate || ""}
      additionalInfo={inv.additionalInfo || ""}
      onRsvpSubmit={handleRsvpSubmit}
    />
  );
}
