"use client";

import React, { useState, useEffect } from "react";
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  Church,
  PartyPopper,
  Landmark,
  Sparkles,
  BookOpen,
  Send,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ChevronDown,
  ArrowUp,
  Share2,
  Copy,
  Check,
  MessageCircle,
  QrCode,
  ExternalLink,
  Gift,
  Download,
  Plane,
  Ticket,
  Stamp,
  Navigation,
  Flame,
} from "lucide-react";
import QRCode from "qrcode";
import { INVITATION_TEMPLATES_20, PHOTO_FRAMES_20 } from "@/lib/invitation-presets";

export interface CeremonyDetail {
  enabled?: boolean;
  title?: string;
  time?: string;
  date?: string;
  location?: string;
  address?: string;
  mapUrl?: string;
  description?: string;
}

export interface FullInvitationData {
  slug: string;
  heroTitle: string;
  subTitle?: string;
  coupleNames?: string;
  weddingDate: string;
  weddingTime?: string;
  city?: string;
  venueName: string;
  venueAddress?: string;
  venueMapUrl?: string;
  customVerse?: string;
  introText?: string;
  loveStory?: string;
  testimony?: string;
  pastorWord?: string;
  finalMessage?: string;
  rsvpDeadline?: string;
  hasPhoto: boolean;
  heroImageUrl?: string;
  cardTemplate: string;
  sansPhotoStyle: string;
  photoLayout: string;
  photoZoom?: number;
  photoPosition?: string;
  photoPositionX?: number;
  photoPositionY?: number;
  customPrimaryColor?: string;
  customSecondaryColor?: string;
  customAccentColor?: string;
  customTextColor?: string;
  customFontFamily?: string;
  customFontSize?: string;
  customTextAlign?: string;
  showCountdown?: boolean;
  showStory?: boolean;
  showProgramme?: boolean;
  showLocations?: boolean;
  showVerse?: boolean;
  showRsvp?: boolean;
  showCagnotte?: boolean;
  showQrCode?: boolean;
  cagnotteEnabled?: boolean;
  cagnotteTitle?: string;
  cagnotteDescription?: string;
  cagnottePaymentMethod?: string;
  cagnottePaymentUrl?: string;
  cagnotteButtonText?: string;
  ceremoniesSelected?: string[];
  ceremoniesDetails?: Record<string, CeremonyDetail>;
  dotDate?: string;
  civilDate?: string;
  churchDate?: string;
  receptionDate?: string;
  additionalInfo?: string;
  isInteractivePreview?: boolean;
  onRsvpSubmit?: (data: {
    guestName: string;
    email?: string;
    phone?: string;
    attendanceStatus: "confirmed" | "declined" | "maybe";
    plusOnesCount: number;
    messageForCouple?: string;
    prayerWishes?: string;
  }) => Promise<{ success: boolean; message?: string }>;
}

export function DigitalInvitationExperience({
  slug,
  heroTitle,
  subTitle = "Nous nous marions",
  coupleNames,
  weddingDate,
  weddingTime = "10:00",
  city = "Abidjan",
  venueName,
  venueAddress,
  venueMapUrl,
  customVerse,
  introText,
  loveStory,
  testimony,
  pastorWord,
  finalMessage,
  rsvpDeadline = "31 Octobre 2025",
  hasPhoto = true,
  heroImageUrl,
  cardTemplate = "terracotta_or",
  sansPhotoStyle = "monogram",
  photoLayout = "arche",
  photoZoom = 100,
  photoPositionX = 50,
  photoPositionY = 50,
  customPrimaryColor,
  customSecondaryColor,
  customAccentColor,
  customTextColor,
  customFontFamily,
  customFontSize = "md",
  customTextAlign = "center",
  showCountdown = true,
  showStory = true,
  showProgramme = true,
  showLocations = true,
  showVerse = true,
  showRsvp = true,
  showCagnotte = true,
  showQrCode = true,
  cagnotteEnabled = true,
  cagnotteTitle = "Cagnotte Foyer & Premier Loyer",
  cagnotteDescription = "Pour les proches qui souhaitent manifester leur générosité et participer à l'aménagement du foyer, vous pouvez contribuer directement par votre moyen de paiement habituel.",
  cagnottePaymentMethod = "wave",
  cagnottePaymentUrl,
  cagnotteButtonText = "Contribuer au foyer",
  ceremoniesSelected = ["dot", "civil", "church", "reception"],
  ceremoniesDetails,
  dotDate = "Samedi 13 Septembre 2025 à 10:00",
  civilDate = "Samedi 15 Novembre 2025 à 09:30",
  churchDate = "Samedi 15 Novembre 2025 à 11:30",
  receptionDate = "Samedi 15 Novembre 2025 à 14:00",
  additionalInfo,
  isInteractivePreview = false,
  onRsvpSubmit,
}: FullInvitationData) {
  const displayName = coupleNames || heroTitle || "David Kouassi & Ruth Yao";
  const namesArray = displayName.split("&").map((s) => s.trim());
  const partner1First = namesArray[0]?.split(" ")[0] || "David";
  const partner2First = namesArray[1]?.split(" ")[0] || "Ruth";
  const initial1 = partner1First.charAt(0) || "D";
  const initial2 = partner2First.charAt(0) || "R";

  // Template preset lookup
  const preset =
    INVITATION_TEMPLATES_20.find((t) => t.id === cardTemplate) ||
    INVITATION_TEMPLATES_20[2]; // Default Terracotta & Or

  const framePreset =
    PHOTO_FRAMES_20.find((f) => f.id === photoLayout) ||
    PHOTO_FRAMES_20[5]; // Default Arche

  // Resolved dynamic design colors
  const primaryColor = customPrimaryColor || preset.primary;
  const accentColor = customAccentColor || preset.accent;
  const textColor = customTextColor || preset.secondary;

  // Font family resolution
  const resolvedFontClass =
    customFontFamily ? `font-${customFontFamily}` : preset.fontClass;

  // Countdown calculations
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const calculateCountdown = () => {
      let targetTimestamp = Date.parse(weddingDate);
      if (isNaN(targetTimestamp)) {
        const match = weddingDate.match(/\d{4}-\d{2}-\d{2}/);
        if (match) {
          targetTimestamp = new Date(match[0]).getTime();
        } else {
          targetTimestamp = new Date("2025-11-15T10:00:00").getTime();
        }
      }

      const now = new Date().getTime();
      const difference = targetTimestamp - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isPast: false });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [weddingDate]);

  // QR Code generation
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const publicInvitationUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invitation/${slug}`
      : `https://weddingmood.ci/invitation/${slug}`;

  useEffect(() => {
    if (slug) {
      QRCode.toDataURL(publicInvitationUrl, {
        width: 320,
        margin: 2,
        color: { dark: "#1E293B", light: "#FFFFFF" },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [slug, publicInvitationUrl]);

  // RSVP Form States
  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [attendanceChoice, setAttendanceChoice] = useState<"confirmed" | "declined" | "maybe">("confirmed");
  const [plusOnesCount, setPlusOnesCount] = useState(0);
  const [messageForCouple, setMessageForCouple] = useState("");
  const [prayerWishes, setPrayerWishes] = useState("");
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpResultMessage, setRsvpResultMessage] = useState("");

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    if (onRsvpSubmit) {
      setRsvpSubmitting(true);
      try {
        const res = await onRsvpSubmit({
          guestName: guestName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          attendanceStatus: attendanceChoice,
          plusOnesCount,
          messageForCouple: messageForCouple.trim() || undefined,
          prayerWishes: prayerWishes.trim() || undefined,
        });
        setRsvpSubmitting(false);
        if (res.success) {
          setRsvpSubmitted(true);
          setRsvpResultMessage(res.message || "Votre présence a été enregistrée avec joie.");
        }
      } catch {
        setRsvpSubmitting(false);
      }
    } else {
      setRsvpSubmitted(true);
      setRsvpResultMessage("Merci ! Votre réponse a bien été enregistrée.");
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className={`w-full min-h-screen text-stone-900 ${preset.surfaceBg} ${resolvedFontClass} text-${customTextAlign} selection:bg-[${primaryColor}] selection:text-white pb-24`}
    >
      {/* SECTION 1: HEADER ET COUVERTURE HAUT DE GAMME */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-between px-4 sm:px-6 py-10 text-center overflow-hidden border-b border-stone-200/50">
        {/* Halo de lumière blanche & ivoire */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-b from-[#FFFDF0]/80 via-white/50 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        {/* Badge d'accueil & Titres */}
        <div className="relative z-10 space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold uppercase tracking-widest shadow-2xs border border-stone-200/80">
            <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <span style={{ color: primaryColor }}>{subTitle}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-stone-950 leading-tight pt-1">
            {partner1First} & {partner2First}
          </h1>

          <p className="text-stone-600 font-serif italic text-xs sm:text-base max-w-lg mx-auto pt-1 leading-relaxed">
            {introText || "Nous avons la joie de vous inviter à célébrer avec nous le début de notre foyer."}
          </p>
        </div>

        {/* ZONE CENTRALE : PHOTO AVEC CADRE CHOISI OU SANS-PHOTO SUBLIME */}
        <div className="relative z-10 w-full max-w-xl py-6 flex justify-center">
          {hasPhoto && heroImageUrl ? (
            /* COMPOSITIONS SPÉCIALES SELON LE MODÈLE CHOISI */

            /* Modèle 10 : PASSEPORT DE MARIAGE */
            cardTemplate === "passeport" ? (
              <div className="w-full max-w-md bg-white rounded-3xl border-2 border-[#1E3A2F]/40 shadow-2xl p-6 space-y-4 text-left relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#1E3A2F]/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Stamp className="w-5 h-5 text-[#C05638]" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#1E3A2F] font-bold">
                      PASSEPORT D'ALLIANCE N° {slug.toUpperCase().slice(0, 8)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    RÉPUBLIQUE DE L'AMOUR
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  <div className="w-32 h-40 rounded-xl overflow-hidden border-2 border-stone-300 shadow-sm shrink-0">
                    <img
                      src={heroImageUrl}
                      alt={displayName}
                      style={{
                        transform: `scale(${photoZoom / 100})`,
                        objectPosition: `${photoPositionX}% ${photoPositionY}%`,
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5 text-xs text-stone-700 w-full">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 block">Époux & Épouse</span>
                      <strong className="text-stone-900 font-serif text-sm">{partner1First} & {partner2First}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 block">Date de Validité</span>
                      <strong className="text-stone-900">{weddingDate} (Pour l'éternité)</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 block">Destination</span>
                      <strong className="text-stone-900">{venueName} ({city})</strong>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-[10px] text-stone-600 font-mono text-center">
                  &lt;&lt;&lt; {partner1First.toUpperCase()}&lt;&lt;{partner2First.toUpperCase()}&lt;&lt;&lt;&lt;&lt;&lt; CI &lt; 2025 &lt; UNIS EN CHRIST
                </div>
              </div>
            ) : cardTemplate === "boarding_pass" ? (
              /* Modèle 11 : BOARDING PASS (BILLET D'EMBARQUEMENT ÉLÉGANT) */
              <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-blue-200/80 shadow-2xl p-6 space-y-4 text-left relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Plane className="w-5 h-5 text-[#C05638]" />
                    <span className="font-mono text-xs uppercase tracking-widest font-bold">
                      BOARDING PASS • VOL NUPTIAL 2025
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    FIRST CLASS
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-32 h-36 rounded-2xl overflow-hidden border border-blue-200 shadow-sm shrink-0">
                    <img
                      src={heroImageUrl}
                      alt={displayName}
                      style={{
                        transform: `scale(${photoZoom / 100})`,
                        objectPosition: `${photoPositionX}% ${photoPositionY}%`,
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs w-full">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 block">Passagers</span>
                      <strong className="text-stone-900 font-serif">{partner1First} & {partner2First}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 block">Embarquement</span>
                      <strong className="text-stone-900">{weddingTime || "10:00"}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 block">Date</span>
                      <strong className="text-stone-900">{weddingDate}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 block">Destination</span>
                      <strong className="text-stone-900">{city}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-stone-200 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                  <span>GATE: BONHEUR</span>
                  <span>SEAT: CŒUR À CŒUR</span>
                  <span className="font-bold text-[#C05638]">CONFIRMATION REQUISE</span>
                </div>
              </div>
            ) : cardTemplate === "ticket" ? (
              /* Modèle 12 : TICKET ÉVÉNEMENTIEL VIP */
              <div className="w-full max-w-md bg-white rounded-3xl border-2 border-[#B94A3D]/40 shadow-2xl p-6 space-y-4 text-left relative overflow-hidden">
                {/* Encoches latérales du ticket */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-100 border border-stone-300"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-100 border border-stone-300"></div>

                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <span className="text-[10px] font-bold tracking-widest text-[#B94A3D] uppercase">
                    INVITATION VIP • ACCÈS CÉLÉBRATION
                  </span>
                  <Ticket className="w-5 h-5 text-[#B94A3D]" />
                </div>

                <div className="flex gap-4 items-center">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden border border-stone-200 shrink-0">
                    <img
                      src={heroImageUrl}
                      alt={displayName}
                      style={{
                        transform: `scale(${photoZoom / 100})`,
                        objectPosition: `${photoPositionX}% ${photoPositionY}%`,
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-serif font-bold text-base text-stone-900">{displayName}</h4>
                    <p className="text-stone-600 font-medium">{weddingDate}</p>
                    <p className="text-stone-500 text-[11px]">{venueName}</p>
                  </div>
                </div>
              </div>
            ) : cardTemplate === "carte_postale" ? (
              /* Modèle 9 : CARTE POSTALE ÉLÉGANTE */
              <div className="w-full max-w-lg bg-[#FAF6EE] rounded-3xl border-2 border-dashed border-[#B37D28]/60 shadow-2xl p-6 space-y-4 text-left relative">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 max-w-[240px]">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#B37D28]">CARTE D'ALLIANCE</span>
                    <h3 className="font-serif font-bold text-xl text-stone-900">{displayName}</h3>
                    <p className="font-serif italic text-xs text-stone-600">« {customVerse || "Deux valent mieux qu'un..."} »</p>
                  </div>
                  <div className="w-16 h-20 rounded-md border-2 border-dashed border-[#B37D28] p-1 bg-white flex flex-col items-center justify-center text-center">
                    <Heart className="w-4 h-4 text-[#C05638] fill-current" />
                    <span className="text-[8px] font-bold text-stone-500 uppercase mt-1">TIMBRE NUPTIAL</span>
                  </div>
                </div>

                <div className="h-44 rounded-2xl overflow-hidden border border-stone-300">
                  <img
                    src={heroImageUrl}
                    alt={displayName}
                    style={{
                      transform: `scale(${photoZoom / 100})`,
                      objectPosition: `${photoPositionX}% ${photoPositionY}%`,
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : cardTemplate === "polaroid_elegant" ? (
              /* Modèle 8 : POLAROID ÉLÉGANT */
              <div className="w-full max-w-xs pt-3 px-3 pb-12 bg-white rounded-2xl shadow-2xl border border-stone-200 mx-auto text-center space-y-3">
                <div className="w-full h-64 rounded-xl overflow-hidden">
                  <img
                    src={heroImageUrl}
                    alt={displayName}
                    style={{
                      transform: `scale(${photoZoom / 100})`,
                      objectPosition: `${photoPositionX}% ${photoPositionY}%`,
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="font-serif font-bold text-lg text-stone-900 pt-1">
                  {partner1First} & {partner2First}
                </div>
                <span className="text-xs text-stone-500 font-serif italic block">
                  {weddingDate}
                </span>
              </div>
            ) : (
              /* CADRE UNIVERSEL PARAMÉTRABLE PARMI LES 20 FORMES */
              <div className="relative">
                <div className={`overflow-hidden ${framePreset.containerClass}`}>
                  <img
                    src={heroImageUrl}
                    alt={displayName}
                    style={{
                      transform: `scale(${photoZoom / 100})`,
                      objectPosition: `${photoPositionX}% ${photoPositionY}%`,
                    }}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                </div>
              </div>
            )
          ) : (
            /* COMPOSITIONS SANS PHOTO : VRAIS DESIGNS ALTERNATIFS ROYAUX */
            <div className="p-8 sm:p-12 rounded-3xl bg-white/90 backdrop-blur-md border border-[#D4AF37]/50 shadow-xl space-y-6 max-w-lg mx-auto text-center relative">
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37] opacity-60"></div>
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37] opacity-60"></div>
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37] opacity-60"></div>
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37] opacity-60"></div>

              {/* Style Monogramme */}
              {sansPhotoStyle === "monogram" && (
                <div className="space-y-4 py-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto border-2 border-[#D4AF37] flex items-center justify-center bg-gradient-to-br from-[#FFFDF0] to-[#FAF6EE] shadow-md">
                    <span
                      className="font-serif font-black text-3xl sm:text-4xl tracking-tighter"
                      style={{ color: primaryColor }}
                    >
                      {initial1}&{initial2}
                    </span>
                  </div>
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-wide">
                    {partner1First} & {partner2First}
                  </div>
                  <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto opacity-70"></div>
                  <div className="text-xs uppercase tracking-widest font-bold" style={{ color: accentColor }}>
                    {weddingDate}
                  </div>
                </div>
              )}

              {/* Style Typographique */}
              {sansPhotoStyle === "typographic" && (
                <div className="space-y-3 py-6">
                  <div className="text-xs uppercase tracking-[0.3em] font-bold text-[#B37D28]">
                    CÉLÉBRATION D'ALLIANCE
                  </div>
                  <div className="font-serif font-extrabold text-3xl sm:text-4xl text-stone-900 tracking-wider">
                    {partner1First.toUpperCase()}
                  </div>
                  <div className="font-serif italic text-2xl" style={{ color: primaryColor }}>&</div>
                  <div className="font-serif font-extrabold text-3xl sm:text-4xl text-stone-900 tracking-wider">
                    {partner2First.toUpperCase()}
                  </div>
                  <div className="text-xs font-serif italic text-stone-600 pt-2">
                    {weddingDate}
                  </div>
                </div>
              )}

              {/* Style Floral */}
              {sansPhotoStyle === "floral" && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-center gap-2 text-[#D4AF37]">
                    <span className="w-8 h-px bg-[#D4AF37]"></span>
                    <Heart className="w-5 h-5 fill-current" style={{ color: primaryColor }} />
                    <span className="w-8 h-px bg-[#D4AF37]"></span>
                  </div>
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                    {partner1First} & {partner2First}
                  </div>
                  <p className="text-xs font-serif italic text-stone-600 max-w-xs mx-auto">
                    « L'amour est patient, il est plein de bonté. » (1 Corinthiens 13:4)
                  </p>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                    {weddingDate}
                  </div>
                </div>
              )}

              {/* Style Spirituel */}
              {sansPhotoStyle === "spiritual" && (
                <div className="space-y-3 py-4">
                  <div className="w-10 h-10 rounded-full bg-amber-50 border border-[#D4AF37] flex items-center justify-center mx-auto" style={{ color: primaryColor }}>
                    <Church className="w-5 h-5" />
                  </div>
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                    {partner1First} & {partner2First}
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50/70 border border-stone-200 text-xs font-serif italic text-stone-700 leading-relaxed">
                    « {customVerse || "Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement."} »
                  </div>
                  <div className="text-xs font-bold tracking-wider" style={{ color: accentColor }}>
                    {weddingDate}
                  </div>
                </div>
              )}

              {/* Style Terracotta Gold */}
              {sansPhotoStyle === "terracotta_gold" && (
                <div className="space-y-4 py-4">
                  <div className="w-16 h-1 mx-auto rounded-full" style={{ backgroundColor: primaryColor }}></div>
                  <div className="font-serif text-3xl sm:text-4xl font-black text-stone-900">
                    {partner1First} <span style={{ color: primaryColor }}>&</span> {partner2First}
                  </div>
                  <div className="text-xs uppercase tracking-widest font-bold" style={{ color: accentColor }}>
                    {weddingDate} • {venueName}
                  </div>
                  <div className="w-16 h-1 mx-auto rounded-full" style={{ backgroundColor: accentColor }}></div>
                </div>
              )}

              {/* Style African Chic */}
              {sansPhotoStyle === "african_chic" && (
                <div className="space-y-4 py-4">
                  <div className="flex justify-center items-center gap-1.5" style={{ color: accentColor }}>
                    <span className="w-3 h-3 rotate-45 border border-current"></span>
                    <span className="w-3 h-3 rotate-45" style={{ backgroundColor: primaryColor }}></span>
                    <span className="w-3 h-3 rotate-45 border border-current"></span>
                  </div>
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-stone-950">
                    {partner1First} & {partner2First}
                  </div>
                  <p className="text-xs text-stone-600 font-medium">
                    Alliance traditionnelle et bénédiction en Christ
                  </p>
                  <div className="text-xs font-bold tracking-wider uppercase" style={{ color: primaryColor }}>
                    {weddingDate}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pied de section couverture */}
        <div className="relative z-10 space-y-4 pb-2">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-stone-800">
            <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/80 font-serif font-bold shadow-2xs flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
              <span>{weddingDate}</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/80 shadow-2xs flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
              <span>{venueName}</span>
            </div>
          </div>

          <div>
            <button
              onClick={() => scrollToSection("compte-a-rebours")}
              className="px-6 py-3 rounded-full text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 mx-auto cursor-pointer hover:scale-105"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Découvrir notre invitation</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: COMPTE À REBOURS (SI ACTIVÉ) */}
      {showCountdown && (
        <section id="compte-a-rebours" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-6">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest font-bold block" style={{ color: primaryColor }}>
              Le Grand Rendez-Vous
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900">
              {timeLeft.isPast ? "Notre grand jour a été célébré !" : "Notre grand jour dans"}
            </h2>
          </div>

          {timeLeft.isPast ? (
            <div className="p-6 rounded-3xl bg-white/95 border border-stone-200 shadow-sm max-w-md mx-auto text-center space-y-2">
              <Heart className="w-8 h-8 mx-auto fill-current" style={{ color: primaryColor }} />
              <p className="font-serif text-lg font-bold text-stone-900">
                Célébration accomplie, gloire à Dieu !
              </p>
              <p className="text-xs text-stone-600">
                Merci à tous nos proches pour vos prières, votre présence et votre affection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-lg mx-auto">
              <div className="p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm">
                <span className="font-serif font-black text-2xl sm:text-4xl text-stone-900 block">{timeLeft.days}</span>
                <span className="text-[10px] sm:text-xs uppercase font-bold text-stone-400">Jours</span>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm">
                <span className="font-serif font-black text-2xl sm:text-4xl text-stone-900 block">{String(timeLeft.hours).padStart(2, "0")}</span>
                <span className="text-[10px] sm:text-xs uppercase font-bold text-stone-400">Heures</span>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm">
                <span className="font-serif font-black text-2xl sm:text-4xl text-stone-900 block">{String(timeLeft.minutes).padStart(2, "0")}</span>
                <span className="text-[10px] sm:text-xs uppercase font-bold text-stone-400">Minutes</span>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm">
                <span className="font-serif font-black text-2xl sm:text-4xl block" style={{ color: primaryColor }}>
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs uppercase font-bold text-stone-400">Secondes</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECTION 3: NOTRE VERSET D'ALLIANCE (SI ACTIVÉ) */}
      {showVerse && customVerse && (
        <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto text-center space-y-4">
          <div className="p-8 sm:p-10 rounded-3xl bg-white/90 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#B37D28]">
              Notre Verset d'Alliance
            </span>
            <p className="font-serif italic text-base sm:text-xl text-stone-800 leading-relaxed max-w-xl mx-auto">
              « {customVerse} »
            </p>
            {pastorWord && (
              <p className="text-xs text-stone-500 font-serif italic pt-1 max-w-md mx-auto">
                {pastorWord}
              </p>
            )}
          </div>
        </section>
      )}

      {/* SECTION 4: NOTRE HISTOIRE (SI ACTIVÉE) */}
      {showStory && loveStory && (
        <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs uppercase tracking-widest font-bold block" style={{ color: primaryColor }}>
              Témoignage
            </span>
            <h2 className="font-serif text-3xl font-bold text-stone-900">Notre Histoire</h2>
          </div>

          <div className="p-8 sm:p-12 rounded-3xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm space-y-6 text-center">
            <Heart className="w-8 h-8 mx-auto" style={{ color: primaryColor }} />
            <p className="text-stone-700 text-sm sm:text-base leading-loose max-w-2xl mx-auto whitespace-pre-line">
              {loveStory}
            </p>
            {testimony && (
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs sm:text-sm text-stone-800 italic max-w-xl mx-auto leading-relaxed">
                « {testimony} »
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 5: PROGRAMME « NOTRE JOUR » (SI ACTIVÉ) */}
      {showProgramme && ceremoniesSelected && ceremoniesSelected.length > 0 && (
        <section id="programme" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-1">
            <span className="text-xs uppercase tracking-widest font-bold block" style={{ color: primaryColor }}>
              Déroulement
            </span>
            <h2 className="font-serif text-3xl font-bold text-stone-900">Notre Jour</h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Retrouvez les moments forts de notre célébration et leurs horaires.
            </p>
          </div>

          <div className="space-y-4">
            {ceremoniesSelected.includes("dot") && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 rounded-2xl bg-orange-50 text-[#C05638] shrink-0">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C05638] font-mono">
                      {ceremoniesDetails?.dot?.time || "10:00"}
                    </span>
                    <h3 className="font-serif font-bold text-xl text-stone-900">Dot Traditionnelle</h3>
                    <p className="text-xs text-stone-600">{ceremoniesDetails?.dot?.location || dotDate}</p>
                    {ceremoniesDetails?.dot?.description && (
                      <p className="text-xs text-stone-500">{ceremoniesDetails.dot.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {ceremoniesSelected.includes("civil") && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-800 shrink-0">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800 font-mono">
                      {ceremoniesDetails?.civil?.time || "09:30"}
                    </span>
                    <h3 className="font-serif font-bold text-xl text-stone-900">Mariage Civil</h3>
                    <p className="text-xs text-stone-600">{ceremoniesDetails?.civil?.location || civilDate}</p>
                    {ceremoniesDetails?.civil?.description && (
                      <p className="text-xs text-stone-500">{ceremoniesDetails.civil.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {ceremoniesSelected.includes("church") && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 shrink-0">
                    <Church className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 font-mono">
                      {ceremoniesDetails?.church?.time || "11:30"}
                    </span>
                    <h3 className="font-serif font-bold text-xl text-stone-900">Bénédiction Nuptiale</h3>
                    <p className="text-xs text-stone-600">{ceremoniesDetails?.church?.location || churchDate}</p>
                    {ceremoniesDetails?.church?.description && (
                      <p className="text-xs text-stone-500">{ceremoniesDetails.church.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {ceremoniesSelected.includes("reception") && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-800 shrink-0">
                    <PartyPopper className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-800 font-mono">
                      {ceremoniesDetails?.reception?.time || "14:00"}
                    </span>
                    <h3 className="font-serif font-bold text-xl text-stone-900">Grande Réception & Banquet</h3>
                    <p className="text-xs text-stone-600">{ceremoniesDetails?.reception?.location || receptionDate}</p>
                    {ceremoniesDetails?.reception?.description && (
                      <p className="text-xs text-stone-500">{ceremoniesDetails.reception.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 6: LIEUX & ITINÉRAIRES (SI ACTIVÉS) */}
      {showLocations && (
        <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-1">
            <span className="text-xs uppercase tracking-widest font-bold block" style={{ color: primaryColor }}>
              Accès & Lieux
            </span>
            <h2 className="font-serif text-3xl font-bold text-stone-900">Où nous retrouver</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                <h3 className="font-serif font-bold text-lg text-stone-900">{venueName}</h3>
              </div>
              {venueAddress && <p className="text-xs text-stone-600 leading-relaxed">{venueAddress}</p>}
              {additionalInfo && <p className="text-[11px] text-stone-500">{additionalInfo}</p>}
              <div>
                <a
                  href={
                    venueMapUrl ||
                    `https://maps.google.com/?q=${encodeURIComponent(venueName + " " + (venueAddress || city))}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Voir l'itinéraire sur la carte</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </a>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: accentColor }} />
                  <h3 className="font-serif font-bold text-lg text-stone-900">Accueil & Ponctualité</h3>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  L'ouverture des portes a lieu 30 minutes avant le début des cérémonies afin de faciliter le placement et le recueillement de tous.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700">
                Lieu principal de rassemblement : {city}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 7: FORMULAIRE RSVP INTÉGRÉ (SI ACTIVÉ) */}
      {showRsvp && (
        <section id="rsvp" className="py-16 px-4 sm:px-6 max-w-2xl mx-auto space-y-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-xl space-y-6 text-center">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest font-bold block" style={{ color: primaryColor }}>
                Confirmation
              </span>
              <h2 className="font-serif text-3xl font-bold text-stone-900">
                Votre présence nous ferait plaisir
              </h2>
              <p className="text-xs text-stone-600 max-w-md mx-auto pt-1">
                Merci de nous confirmer votre présence afin de nous permettre de préparer au mieux cette journée.
              </p>
              {rsvpDeadline && (
                <span className="text-[11px] font-bold block pt-1" style={{ color: accentColor }}>
                  Réponse souhaitée avant le {rsvpDeadline}
                </span>
              )}
            </div>

            {rsvpSubmitted ? (
              <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-3 text-center animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="font-serif font-bold text-emerald-950 text-xl">
                  Merci {guestName ? guestName.split(" ")[0] : ""} !
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
                  {rsvpResultMessage || "Votre réponse a bien été enregistrée. Nous sommes heureux de vous compter parmi nous."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5 text-xs text-left">
                <div className="space-y-1.5">
                  <label className="block font-bold text-stone-800">Serez-vous présent ? *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAttendanceChoice("confirmed")}
                      className={`py-3 px-3 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        attendanceChoice === "confirmed"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Oui, présent</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendanceChoice("maybe")}
                      className={`py-3 px-3 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        attendanceChoice === "maybe"
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Je ne sais pas encore</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendanceChoice("declined")}
                      className={`py-3 px-3 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        attendanceChoice === "declined"
                          ? "bg-stone-800 text-white border-stone-800 shadow-xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Non, empêché</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Nom et prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Frère Marc Kouadio"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Téléphone ou WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+225 07..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Nombre de personnes (+1)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={plusOnesCount}
                      onChange={(e) => setPlusOnesCount(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Message au couple</label>
                  <textarea
                    rows={2}
                    placeholder="Un mot d'encouragement pour les mariés..."
                    value={messageForCouple}
                    onChange={(e) => setMessageForCouple(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs"
                  ></textarea>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Prière ou conseil pour le couple</label>
                  <textarea
                    rows={2}
                    placeholder="Que l'Éternel bénisse abondamment votre foyer..."
                    value={prayerWishes}
                    onChange={(e) => setPrayerWishes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={rsvpSubmitting || !guestName.trim()}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
                  style={{ backgroundColor: primaryColor }}
                >
                  {rsvpSubmitting ? "Enregistrement..." : "Confirmer ma réponse"}
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* SECTION 8: CAGNOTTE PERSONNALISÉE (LIEN DE PAIEMENT LIBRE DU COUPLE SANS COMMISSION) */}
      {showCagnotte && cagnotteEnabled && (
        <section className="py-12 px-4 sm:px-6 max-w-2xl mx-auto text-center space-y-4">
          <div className="p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-[#D4AF37]/50 shadow-md space-y-4">
            <Gift className="w-8 h-8 mx-auto" style={{ color: accentColor }} />
            <h3 className="font-serif text-2xl font-bold text-stone-900">{cagnotteTitle}</h3>
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
              {cagnotteDescription}
            </p>

            {cagnottePaymentUrl ? (
              <a
                href={cagnottePaymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <span>{cagnotteButtonText}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <div className="p-3 bg-stone-50 rounded-xl text-stone-500 text-[11px] max-w-sm mx-auto">
                Moyen de contribution proposé : {cagnottePaymentMethod.toUpperCase()} (Contactez directement le couple pour les coordonnées).
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 9: QR CODE OFFICIEL DU FAIRE-PART */}
      {showQrCode && qrCodeDataUrl && (
        <section className="py-12 px-4 sm:px-6 max-w-sm mx-auto text-center space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: accentColor }}>
              Accès Direct Smartphone
            </span>
            <h4 className="font-serif font-bold text-stone-900 text-lg">QR Code du Faire-Part</h4>
            <div className="flex justify-center p-3 bg-stone-50 rounded-2xl border border-stone-100">
              <img src={qrCodeDataUrl} alt="QR Code Faire-Part" className="w-44 h-44 rounded-xl" />
            </div>
            <p className="text-[11px] text-stone-500">
              Scannez pour ouvrir l'invitation sur votre téléphone ou partager avec un invité.
            </p>
          </div>
        </section>
      )}

      {/* SECTION 10: FIN DE L'INVITATION & REMERCIEMENTS */}
      <footer className="py-16 px-4 sm:px-6 max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <Heart className="w-6 h-6 mx-auto fill-current" style={{ color: primaryColor }} />
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Merci de partager notre joie
          </h3>
          <div className="font-serif font-bold text-lg" style={{ color: primaryColor }}>
            {partner1First} & {partner2First}
          </div>
          <p className="text-xs text-stone-600 font-serif italic max-w-md mx-auto leading-relaxed pt-1">
            {finalMessage || "« Que l'amour, la foi et la grâce de Dieu accompagnent notre foyer. »"}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {showRsvp && (
            <button
              onClick={() => scrollToSection("rsvp")}
              className="px-6 py-2.5 rounded-full text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              Confirmer ma présence
            </button>
          )}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="px-5 py-2.5 rounded-full bg-white border border-stone-200 text-stone-700 text-xs font-bold shadow-2xs hover:bg-stone-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Retour en haut</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
