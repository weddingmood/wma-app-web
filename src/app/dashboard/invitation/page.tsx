"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  Send,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Save,
  Smartphone,
  Monitor,
  Heart,
  Calendar,
  MapPin,
  Church,
  PartyPopper,
  Landmark,
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  Share2,
  MessageCircle,
  Eye,
  Sliders,
  Check,
  Users,
  ZoomIn,
  QrCode,
  Download,
  Gift,
  Palette,
  Move,
  Layers,
  Type,
  Layout,
  Clock,
} from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  DigitalInvitationExperience,
  CeremonyDetail,
} from "@/components/DigitalInvitationExperience";
import { INVITATION_TEMPLATES_20, PHOTO_FRAMES_20 } from "@/lib/invitation-presets";

export default function InvitationCreatorPage() {
  const { couple, activeTheme, preferences, refreshCoupleData } = useTheme();
  const editorAnchorRef = useRef<HTMLDivElement>(null);
  const rsvpAnchorRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Device view switcher for real-time simulator
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("mobile");

  // Image Tab mode
  const [imageTabMode, setImageTabMode] = useState<"add" | "existing" | "none">("add");
  const [availablePhotos, setAvailablePhotos] = useState<{ label: string; url: string }[]>([]);

  // RSVP statistics and recent responses
  const [rsvpStats, setRsvpStats] = useState({
    totalResponses: 0,
    confirmedCount: 0,
    declinedCount: 0,
    maybeCount: 0,
    totalGuestsConfirmed: 0,
  });
  const [recentRsvps, setRecentRsvps] = useState<any[]>([]);

  // QR Code data URL
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Editor Section Tab
  const [activeTab, setActiveTab] = useState<
    "modeles" | "photo_cadre" | "textes" | "ceremonies" | "sections" | "cagnotte" | "rsvp"
  >("modeles");

  // Comprehensive Form State
  const [form, setForm] = useState({
    heroTitle: "Invitation au Mariage",
    subTitle: "Nous nous marions",
    coupleNames: "David Kouassi & Ruth Yao",
    weddingDate: "15 Novembre 2025",
    weddingTime: "10:00",
    city: "Abidjan",
    venueName: "Espace Nuptial Riviera Golf",
    venueAddress: "Boulevard François Mitterrand, Cocody, Abidjan",
    venueMapUrl: "https://maps.google.com/?q=Riviera+Golf+Abidjan",
    customVerse: "Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement.",
    introText: "Nous avons la joie de vous inviter à célébrer avec nous le début de notre foyer.",
    loveStory: "Notre histoire a débuté au sein de la chorale de l'église en 2021. À travers les temps de prière fraternelle et les projets partagés, Dieu a scellé notre amour pour l'éternité.",
    testimony: "« Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu » (Romains 8:28).",
    pastorWord: "« Que ce couple soit une maison bâtie sur le roc. Que la lumière de Christ brille à travers leur alliance. » - Pasteur Jean-Marc Kouadio",
    finalMessage: "Merci de partager notre joie. Que l'amour, la foi et la grâce de Dieu accompagnent notre foyer.",
    rsvpDeadline: "31 Octobre 2025",
    publicationStatus: "published", // draft, ready_to_publish, published, updating
    hasPhoto: true,
    heroImageUrl: "",
    cardTemplate: "terracotta_or",
    sansPhotoStyle: "monogram",
    photoLayout: "arche",
    photoZoom: 100,
    photoPositionX: 50,
    photoPositionY: 50,
    customPrimaryColor: "",
    customSecondaryColor: "",
    customAccentColor: "",
    customTextColor: "",
    customFontFamily: "cormorant",
    customFontSize: "md",
    customTextAlign: "center",
    showCountdown: true,
    showStory: true,
    showProgramme: true,
    showLocations: true,
    showVerse: true,
    showRsvp: true,
    showCagnotte: true,
    showQrCode: true,
    cagnotteEnabled: true,
    cagnotteTitle: "Cagnotte Foyer & Premier Loyer",
    cagnotteDescription: "Pour les proches qui souhaitent manifester leur générosité et participer à l'aménagement du foyer, vous pouvez contribuer directement par votre moyen de paiement habituel.",
    cagnottePaymentMethod: "wave",
    cagnottePaymentUrl: "https://pay.wave.com/m/M_W9fOyOGfFiNN/c/ci/?amount=2000",
    cagnotteButtonText: "Contribuer au foyer",
    ceremoniesSelected: ["dot", "civil", "church", "reception"],
    ceremoniesDetails: {
      dot: {
        time: "10:00",
        date: "Samedi 13 Septembre 2025",
        location: "Domicile Familial Yao - Cocody",
        address: "Rue des Jardins, Cocody, Abidjan",
        description: "Célébration coutumière honorant nos deux familles dans l'Évangile.",
      },
      civil: {
        time: "09:30",
        date: "Samedi 15 Novembre 2025",
        location: "Mairie de Cocody - Salle des Noces",
        address: "Boulevard de la République, Cocody",
        description: "Célébration officielle devant l'Officier de l'État Civil.",
      },
      church: {
        time: "11:30",
        date: "Samedi 15 Novembre 2025",
        location: "Église Évangélique Grâce et Vie",
        address: "Riviera 3, près du Lycée Français",
        description: "Culte solennel de bénédiction nuptiale et échange des vœux sacrés.",
      },
      reception: {
        time: "14:00",
        date: "Samedi 15 Novembre 2025",
        location: "Grande Salle Nuptiale Riviera Golf",
        address: "Boulevard François Mitterrand, Riviera Golf",
        description: "Banquet de noce, réjouissances, animation gospel live et mur de bénédictions.",
      },
    } as Record<string, CeremonyDetail>,
    dotDate: "Samedi 13 Septembre 2025 à 10:00",
    civilDate: "Samedi 15 Novembre 2025 à 09:30",
    churchDate: "Samedi 15 Novembre 2025 à 11:30",
    receptionDate: "Samedi 15 Novembre 2025 à 14:00",
    additionalInfo: "Tenue d'honneur recommandée : Pagne Kita traditionnel ou blanc épuré.",
  });

  const coupleSlug = couple?.slug || "david-ruth";
  const publicLink = `/invitation/${coupleSlug}`;

  const getFullPublicUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/invitation/${coupleSlug}`;
    }
    return `https://weddingmood.ci/invitation/${coupleSlug}`;
  };

  // Fetch data
  useEffect(() => {
    async function fetchInvitationData() {
      try {
        setLoading(true);
        const res = await fetch("/api/invitations");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const inv = data.invitation;
            const c = data.couple || couple;

            if (data.availablePhotos) {
              setAvailablePhotos(data.availablePhotos);
            }
            if (data.stats) {
              setRsvpStats(data.stats);
            }
            if (data.recentRsvps) {
              setRecentRsvps(data.recentRsvps);
            }

            if (inv) {
              const defaultHasPhoto = inv.hasPhoto !== undefined ? inv.hasPhoto : true;
              setForm((prev) => ({
                ...prev,
                heroTitle: inv.heroTitle || "Invitation au Mariage",
                subTitle: inv.subTitle || "Nous nous marions",
                coupleNames: `${c?.partner1Name || "David"} & ${c?.partner2Name || "Ruth"}`,
                weddingDate: inv.weddingDate || c?.weddingDate || "15 Novembre 2025",
                weddingTime: inv.weddingTime || "10:00",
                city: c?.city || "Abidjan",
                venueName: inv.venueName || c?.venue || "Espace Nuptial Riviera Golf",
                venueAddress: inv.venueAddress || (c?.city ? `${c.city}, Côte d'Ivoire` : "Abidjan, Côte d'Ivoire"),
                venueMapUrl: inv.venueMapUrl || "https://maps.google.com/?q=Riviera+Golf+Abidjan",
                customVerse: inv.customVerse || c?.bibleVerse || "Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement.",
                introText: inv.introText || "Nous avons la joie de vous inviter à célébrer avec nous le début de notre foyer.",
                loveStory: inv.loveStory || prev.loveStory,
                testimony: inv.testimony || prev.testimony,
                pastorWord: inv.pastorWord || prev.pastorWord,
                finalMessage: inv.finalMessage || prev.finalMessage,
                rsvpDeadline: inv.rsvpDeadline || "31 Octobre 2025",
                publicationStatus: inv.publicationStatus || "published",
                hasPhoto: defaultHasPhoto,
                heroImageUrl: inv.heroImageUrl || preferences.coverPhotoUrl || c?.partner1Photo || "",
                cardTemplate: inv.cardTemplate || "terracotta_or",
                sansPhotoStyle: inv.sansPhotoStyle || "monogram",
                photoLayout: inv.photoLayout || "arche",
                photoZoom: inv.photoZoom || 100,
                photoPositionX: inv.photoPositionX !== undefined ? inv.photoPositionX : 50,
                photoPositionY: inv.photoPositionY !== undefined ? inv.photoPositionY : 50,
                customPrimaryColor: inv.customPrimaryColor || "",
                customSecondaryColor: inv.customSecondaryColor || "",
                customAccentColor: inv.customAccentColor || "",
                customTextColor: inv.customTextColor || "",
                customFontFamily: inv.customFontFamily || "cormorant",
                customFontSize: inv.customFontSize || "md",
                customTextAlign: inv.customTextAlign || "center",
                showCountdown: inv.showCountdown !== undefined ? inv.showCountdown : true,
                showStory: inv.showStory !== undefined ? inv.showStory : true,
                showProgramme: inv.showProgramme !== undefined ? inv.showProgramme : true,
                showLocations: inv.showLocations !== undefined ? inv.showLocations : true,
                showVerse: inv.showVerse !== undefined ? inv.showVerse : true,
                showRsvp: inv.showRsvp !== undefined ? inv.showRsvp : true,
                showCagnotte: inv.showCagnotte !== undefined ? inv.showCagnotte : true,
                showQrCode: inv.showQrCode !== undefined ? inv.showQrCode : true,
                cagnotteEnabled: inv.cagnotteEnabled !== undefined ? inv.cagnotteEnabled : true,
                cagnotteTitle: inv.cagnotteTitle || "Cagnotte Foyer & Premier Loyer",
                cagnotteDescription: inv.cagnotteDescription || prev.cagnotteDescription,
                cagnottePaymentMethod: inv.cagnottePaymentMethod || "wave",
                cagnottePaymentUrl: inv.cagnottePaymentUrl || "https://pay.wave.com/m/M_W9fOyOGfFiNN/c/ci/?amount=2000",
                cagnotteButtonText: inv.cagnotteButtonText || "Contribuer au foyer",
                ceremoniesSelected: Array.isArray(inv.ceremoniesSelected) && inv.ceremoniesSelected.length > 0
                  ? inv.ceremoniesSelected
                  : ["dot", "civil", "church", "reception"],
                ceremoniesDetails: inv.ceremoniesDetails || prev.ceremoniesDetails,
                dotDate: inv.dotDate || prev.dotDate,
                civilDate: inv.civilDate || prev.civilDate,
                churchDate: inv.churchDate || prev.churchDate,
                receptionDate: inv.receptionDate || prev.receptionDate,
                additionalInfo: inv.additionalInfo || prev.additionalInfo,
              }));

              setImageTabMode(defaultHasPhoto ? "add" : "none");
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchInvitationData();
  }, [couple, preferences]);

  // Generate QR Code
  useEffect(() => {
    if (coupleSlug) {
      QRCode.toDataURL(getFullPublicUrl(), {
        width: 320,
        margin: 2,
        color: { dark: "#143A2C", light: "#FFFFFF" },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [coupleSlug]);

  // Image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      alert("Veuillez sélectionner un format d'image valide (JPG, PNG ou WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("L'image dépasse la limite autorisée de 10 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setForm((prev) => ({
        ...prev,
        heroImageUrl: result,
        hasPhoto: true,
      }));
      setImageTabMode("add");
    };
    reader.readAsDataURL(file);
  };

  // Toggle ceremony
  const handleToggleCeremony = (ceremonyKey: string) => {
    setForm((prev) => {
      const current = prev.ceremoniesSelected || [];
      const updated = current.includes(ceremonyKey)
        ? current.filter((k) => k !== ceremonyKey)
        : [...current, ceremonyKey];
      return { ...prev, ceremoniesSelected: updated };
    });
  };

  // Update specific ceremony detail
  const handleCeremonyDetailChange = (key: string, field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      ceremoniesDetails: {
        ...prev.ceremoniesDetails,
        [key]: {
          ...(prev.ceremoniesDetails?.[key] || {}),
          [field]: value,
        },
      },
    }));
  };

  // Save changes
  const handleSaveAll = async (newStatus?: string) => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        publicationStatus: newStatus || form.publicationStatus,
      };

      const res = await fetch("/api/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (newStatus) {
          setForm((prev) => ({ ...prev, publicationStatus: newStatus }));
        }
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 2500);
        await refreshCoupleData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(getFullPublicUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    const message = `${form.coupleNames} ont le plaisir de vous inviter à célébrer leur mariage.\n\nDécouvrez leur faire-part et confirmez votre présence :\n${getFullPublicUrl()}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Native share
  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Faire-part de mariage • ${form.coupleNames}`,
          text: `${form.coupleNames} ont la joie de vous inviter à célébrer leur mariage.`,
          url: getFullPublicUrl(),
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. HEADER DU CRÉATEUR & ÉTATS DE PUBLICATION */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-bold border border-orange-100 mb-2">
              <Send className="w-3.5 h-3.5" />
              <span>Créateur de Faire-Part Numérique • Wedding Mood</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Mon Faire-Part & Mini-Site de Mariage
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Personnalisez votre invitation, prévisualisez sur mobile et ordinateur, publiez en direct et partagez le lien unique avec vos invités.
            </p>
          </div>

          {/* Quick Hub Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Publication state indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold bg-white border-stone-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-stone-700 capitalize">
                {form.publicationStatus === "published"
                  ? "Publié en ligne"
                  : form.publicationStatus === "ready_to_publish"
                  ? "Prêt à publier"
                  : form.publicationStatus === "updating"
                  ? "Mise à jour en cours"
                  : "Brouillon"}
              </span>
            </div>

            <button
              onClick={() => handleSaveAll("published")}
              disabled={saving}
              className="px-4 py-2.5 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: activeTheme.primary }}
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Enregistrement..." : "Publier / Mettre à jour"}</span>
            </button>

            <Link
              href={publicLink}
              target="_blank"
              className="px-4 py-2.5 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Voir le site public</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Public link shareable bar */}
        <div className="p-4 rounded-2xl glass-card-warm border border-[#EAE2D5] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="space-y-0.5">
            <span className="text-stone-500 font-medium">Lien public de votre faire-part :</span>
            <div className="font-serif font-bold text-stone-900 text-sm">
              weddingmood.ci/invitation/{coupleSlug}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copiedLink ? "Copié !" : "Copier le lien"}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Partager sur WhatsApp</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Partager</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DUAL-PANE INTERACTIVE STUDIO: CUSTOMIZER (LEFT) & LIVE VERTICAL SITE PREVIEW (RIGHT) */}
      <div ref={editorAnchorRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANE: COMPLETE INVITATION CUSTOMIZER (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-6 text-xs">
            
            {/* Customizer Sub-Nav Tabs */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Studio de Personnalisation
              </h3>
              {savedMsg && (
                <span className="text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  Enregistré avec succès !
                </span>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-stone-100/90 rounded-2xl">
              {[
                { id: "modeles", label: "20 Modèles" },
                { id: "photo_cadre", label: "Photo & 20 Cadres" },
                { id: "textes", label: "Titres & Textes" },
                { id: "ceremonies", label: "Cérémonies & Lieux" },
                { id: "sections", label: "Affichage Sections" },
                { id: "cagnotte", label: "Cagnotte" },
                { id: "rsvp", label: "RSVP" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-white text-stone-900 shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: 20 FAMILLES DE MODÈLES VISUELS */}
            {activeTab === "modeles" && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    Sélectionnez votre Modèle de Faire-Part (20 Familles)
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Chaque composition possède son agencement, ses typographies, ses bordures et ses détails uniques.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {INVITATION_TEMPLATES_20.map((tmpl) => {
                    const isSelected = form.cardTemplate === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setForm({ ...form, cardTemplate: tmpl.id })}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2.5 cursor-pointer ${
                          isSelected
                            ? "border-stone-900 ring-2 ring-stone-900 bg-white shadow-md"
                            : "glass-card-warm border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: tmpl.primary }}></span>
                            <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: tmpl.accent }}></span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>

                        <div>
                          <strong className="font-serif font-bold text-stone-900 text-xs block leading-tight">
                            {tmpl.name}
                          </strong>
                          <span className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">{tmpl.description}</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {tmpl.styleTags.map((tag, tIdx) => (
                            <span key={tIdx} className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: PHOTO & 20 CADRES & FORMES */}
            {activeTab === "photo_cadre" && (
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    Gestion de la Photo & Choix du Cadre
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    La photo n'est jamais obligatoire. Choisissez une photo ou activez l'une des 6 compositions sans photo.
                  </p>
                </div>

                {/* 3 Choices: Add / Existing / Sans Photo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setImageTabMode("add");
                      setForm((prev) => ({ ...prev, hasPhoto: true }));
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      imageTabMode === "add" && form.hasPhoto
                        ? "bg-white border-[#C05638] ring-2 ring-[#C05638] shadow-xs"
                        : "glass-card-warm border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <Upload className="w-4 h-4 text-[#C05638] mb-1.5" />
                    <strong className="block text-stone-900 font-bold text-xs">Importer une photo</strong>
                    <span className="text-[10px] text-stone-500">Téléphone ou ordinateur</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImageTabMode("existing");
                      setForm((prev) => ({ ...prev, hasPhoto: true }));
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      imageTabMode === "existing" && form.hasPhoto
                        ? "bg-white border-[#B37D28] ring-2 ring-[#B37D28] shadow-xs"
                        : "glass-card-warm border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <Layers className="w-4 h-4 text-[#B37D28] mb-1.5" />
                    <strong className="block text-stone-900 font-bold text-xs">Photo existante</strong>
                    <span className="text-[10px] text-stone-500">Profils Wedding Mood</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImageTabMode("none");
                      setForm((prev) => ({ ...prev, hasPhoto: false }));
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      !form.hasPhoto
                        ? "bg-white border-[#145A32] ring-2 ring-[#145A32] shadow-xs"
                        : "glass-card-warm border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-700 mb-1.5" />
                    <strong className="block text-stone-900 font-bold text-xs">Faire-part sans photo</strong>
                    <span className="text-[10px] text-stone-500">Compositions d'art royales</span>
                  </button>
                </div>

                {/* Upload panel */}
                {imageTabMode === "add" && form.hasPhoto && (
                  <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <label className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-[#C05638] text-white font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Parcourir mes photos</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-stone-500">JPG, PNG, WEBP (&lt; 10 Mo)</span>
                    </div>

                    <div>
                      <label className="block text-stone-600 font-semibold mb-1 text-[11px]">
                        Ou lien web direct vers une photo :
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={form.heroImageUrl}
                        onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value, hasPhoto: true })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900"
                      />
                    </div>
                  </div>
                )}

                {/* Existing photo panel */}
                {imageTabMode === "existing" && form.hasPhoto && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-stone-700 block">Galerie Wedding Mood :</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {availablePhotos.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setForm({ ...form, heroImageUrl: p.url, hasPhoto: true })}
                          className={`relative p-1 rounded-xl border text-left transition-all cursor-pointer ${
                            form.heroImageUrl === p.url
                              ? "border-[#C05638] ring-2 ring-[#C05638]"
                              : "border-stone-200 hover:border-stone-300"
                          }`}
                        >
                          <img src={p.url} alt={p.label} className="w-full h-16 object-cover rounded-lg" />
                          <span className="text-[9px] font-bold text-stone-700 truncate block mt-1">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SANS PHOTO STYLES */}
                {!form.hasPhoto && (
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-stone-800 block">
                      Style de la Couverture Sans Photo :
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: "monogram", name: "Style Monogramme", desc: "Sceau royal entrelacé D & R" },
                        { id: "typographic", name: "Style Typographique", desc: "Grande typographie noble DAVID & RUTH" },
                        { id: "floral", name: "Style Floral", desc: "Ornements floraux délicats" },
                        { id: "spiritual", name: "Style Spirituel", desc: "Verset sacré et croix d'alliance" },
                        { id: "terracotta_gold", name: "Style Terracotta & Or", desc: "Lignes terracotta et touches dorées" },
                        { id: "african_chic", name: "Style Chic Ivoirien", desc: "Géométrie inspirée de nos traditions" },
                      ].map((style) => {
                        const isSel = form.sansPhotoStyle === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setForm({ ...form, sansPhotoStyle: style.id, hasPhoto: false })}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              isSel
                                ? "bg-white border-[#C05638] ring-2 ring-[#C05638] shadow-xs"
                                : "bg-stone-50/70 border-stone-200 hover:border-stone-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <strong className="font-serif font-bold text-xs text-stone-900">{style.name}</strong>
                              {isSel && <Check className="w-3.5 h-3.5 text-[#C05638]" />}
                            </div>
                            <p className="text-[10px] text-stone-500 mt-0.5">{style.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 20 CADRES ET FORMES DE PHOTO (SI PHOTO ACTIVE) */}
                {form.hasPhoto && (
                  <div className="space-y-3 pt-3 border-t border-stone-100">
                    <span className="text-[11px] font-bold text-stone-800 block">
                      Cadres & Formes de Photo (20 Formes Disponibles) :
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {PHOTO_FRAMES_20.map((frame) => {
                        const isSel = form.photoLayout === frame.id;
                        return (
                          <button
                            key={frame.id}
                            type="button"
                            onClick={() => setForm({ ...form, photoLayout: frame.id })}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSel
                                ? "bg-white border-[#C05638] ring-2 ring-[#C05638] shadow-xs"
                                : "bg-stone-50/70 border-stone-200 hover:border-stone-300"
                            }`}
                          >
                            <strong className="block text-stone-900 font-bold text-[11px] truncate">
                              {frame.name}
                            </strong>
                            <span className="text-[9px] text-stone-500 line-clamp-1">{frame.description}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Zoom & Position horizontal/vertical */}
                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-700 flex items-center gap-1">
                          <ZoomIn className="w-3.5 h-3.5" />
                          Zoom de la photo ({form.photoZoom}%)
                        </span>
                        <input
                          type="range"
                          min={80}
                          max={150}
                          value={form.photoZoom}
                          onChange={(e) => setForm({ ...form, photoZoom: Number(e.target.value) })}
                          className="w-28 accent-[#C05638]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-stone-600 font-semibold mb-1 text-[10px]">
                            Position Horizontale ({form.photoPositionX}%)
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={form.photoPositionX}
                            onChange={(e) => setForm({ ...form, photoPositionX: Number(e.target.value) })}
                            className="w-full accent-[#C05638]"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-600 font-semibold mb-1 text-[10px]">
                            Position Verticale ({form.photoPositionY}%)
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={form.photoPositionY}
                            onChange={(e) => setForm({ ...form, photoPositionY: Number(e.target.value) })}
                            className="w-full accent-[#C05638]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TITRES & TEXTES */}
            {activeTab === "textes" && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Noms du couple *</label>
                    <input
                      type="text"
                      required
                      value={form.coupleNames}
                      onChange={(e) => setForm({ ...form, coupleNames: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-serif font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Sous-titre d'annonce</label>
                    <input
                      type="text"
                      value={form.subTitle}
                      onChange={(e) => setForm({ ...form, subTitle: e.target.value })}
                      placeholder="Ex: Nous nous marions"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Message d'accueil (Introduction)</label>
                  <textarea
                    rows={2}
                    value={form.introText}
                    onChange={(e) => setForm({ ...form, introText: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 leading-relaxed"
                  ></textarea>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Référence et texte du verset biblique</label>
                  <input
                    type="text"
                    value={form.customVerse}
                    onChange={(e) => setForm({ ...form, customVerse: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-serif italic"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Histoire du couple (Notre histoire)</label>
                  <textarea
                    rows={3}
                    value={form.loveStory}
                    onChange={(e) => setForm({ ...form, loveStory: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 leading-relaxed"
                  ></textarea>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Message personnel ou mot du Pasteur</label>
                  <input
                    type="text"
                    value={form.pastorWord}
                    onChange={(e) => setForm({ ...form, pastorWord: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Message final de remerciement</label>
                  <input
                    type="text"
                    value={form.finalMessage}
                    onChange={(e) => setForm({ ...form, finalMessage: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: CÉRÉMONIES & LIEUX */}
            {activeTab === "ceremonies" && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    Cérémonies à afficher sur le faire-part
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Activez les cérémonies souhaitées et personnalisez leurs coordonnées.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: "dot", label: "Dot Traditionnelle", icon: Heart },
                    { id: "civil", label: "Mariage Civil", icon: Landmark },
                    { id: "church", label: "Bénédiction Nuptiale", icon: Church },
                    { id: "reception", label: "Grande Réception & Banquet", icon: PartyPopper },
                  ].map((c) => {
                    const isChecked = form.ceremoniesSelected.includes(c.id);
                    const details = form.ceremoniesDetails?.[c.id] || {};
                    const Icon = c.icon;
                    return (
                      <div key={c.id} className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 font-bold text-stone-900 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCeremony(c.id)}
                              className="w-4 h-4 accent-[#C05638] rounded cursor-pointer"
                            />
                            <Icon className="w-4 h-4 text-[#C05638]" />
                            <span>{c.label}</span>
                          </label>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isChecked ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-500"}`}>
                            {isChecked ? "Visible" : "Masqué"}
                          </span>
                        </div>

                        {isChecked && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-stone-100">
                            <div>
                              <label className="block text-stone-500 text-[10px]">Heure</label>
                              <input
                                type="text"
                                value={details.time || ""}
                                onChange={(e) => handleCeremonyDetailChange(c.id, "time", e.target.value)}
                                placeholder="10:00"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-stone-500 text-[10px]">Lieu / Salle</label>
                              <input
                                type="text"
                                value={details.location || ""}
                                onChange={(e) => handleCeremonyDetailChange(c.id, "location", e.target.value)}
                                placeholder="Nom du lieu"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Date principale *</label>
                    <input
                      type="text"
                      value={form.weddingDate}
                      onChange={(e) => setForm({ ...form, weddingDate: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Lieu principal *</label>
                    <input
                      type="text"
                      value={form.venueName}
                      onChange={(e) => setForm({ ...form, venueName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Lien Google Maps / Itinéraire</label>
                  <input
                    type="url"
                    value={form.venueMapUrl}
                    onChange={(e) => setForm({ ...form, venueMapUrl: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900"
                  />
                </div>
              </div>
            )}

            {/* TAB 5: SECTIONS VISIBLES / MASQUÉES */}
            {activeTab === "sections" && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    Affichage des Sections du Mini-Site
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Choisissez exactement les sections qui apparaîtront sur votre faire-part public.
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { key: "showCountdown", label: "Compte à rebours dynamique jusqu'au mariage" },
                    { key: "showVerse", label: "Section Verset biblique d'alliance" },
                    { key: "showStory", label: "Section Notre histoire & Témoignage" },
                    { key: "showProgramme", label: "Section Programme des cérémonies" },
                    { key: "showLocations", label: "Section Lieux, accès et itinéraires" },
                    { key: "showRsvp", label: "Section Formulaire RSVP interactif" },
                    { key: "showCagnotte", label: "Section Cagnotte du foyer" },
                    { key: "showQrCode", label: "Section QR Code d'accès rapide" },
                  ].map((sec) => {
                    const isChecked = (form as any)[sec.key];
                    return (
                      <label key={sec.key} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200 cursor-pointer hover:bg-stone-50">
                        <span className="font-bold text-stone-800 text-xs">{sec.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setForm({ ...form, [sec.key]: e.target.checked })}
                          className="w-4 h-4 accent-[#C05638] rounded cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 6: CAGNOTTE & LIEN DE PAIEMENT LIBRE */}
            {activeTab === "cagnotte" && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    Cagnotte Foyer & Premier Loyer (Lien de Paiement Libre)
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Insérez votre propre lien de contribution (Wave, Orange Money, etc.) sans aucune commission prélevée.
                  </p>
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-stone-200 cursor-pointer">
                  <div>
                    <strong className="block text-stone-900 text-xs">Activer la section Cagnotte</strong>
                    <span className="text-[10px] text-stone-500">Permet à vos invités de contribuer en ligne</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.cagnotteEnabled}
                    onChange={(e) => setForm({ ...form, cagnotteEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[#C05638] rounded cursor-pointer"
                  />
                </label>

                {form.cagnotteEnabled && (
                  <div className="space-y-3 p-4 rounded-2xl bg-stone-50/80 border border-stone-200">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Moyen de paiement proposé</label>
                      <select
                        value={form.cagnottePaymentMethod}
                        onChange={(e) => setForm({ ...form, cagnottePaymentMethod: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs"
                      >
                        <option value="wave">Wave Côte d'Ivoire</option>
                        <option value="orange_money">Orange Money</option>
                        <option value="mtn_money">MTN Mobile Money</option>
                        <option value="moov_money">Moov Money</option>
                        <option value="other">Autre moyen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Votre lien de paiement ou de contribution *</label>
                      <input
                        type="url"
                        value={form.cagnottePaymentUrl || ""}
                        onChange={(e) => setForm({ ...form, cagnottePaymentUrl: e.target.value })}
                        placeholder="Ex: https://pay.wave.com/m/..."
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Texte du bouton</label>
                      <input
                        type="text"
                        value={form.cagnotteButtonText}
                        onChange={(e) => setForm({ ...form, cagnotteButtonText: e.target.value })}
                        placeholder="Ex: Contribuer au foyer"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Description explicative</label>
                      <textarea
                        rows={2}
                        value={form.cagnotteDescription}
                        onChange={(e) => setForm({ ...form, cagnotteDescription: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 leading-relaxed"
                      ></textarea>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: RSVP & DATE LIMITE */}
            {activeTab === "rsvp" && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    Configuration du Formulaire RSVP
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Définissez la date limite et les informations requises pour vos invités.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Date limite de réponse RSVP *</label>
                  <input
                    type="text"
                    value={form.rsvpDeadline}
                    onChange={(e) => setForm({ ...form, rsvpDeadline: e.target.value })}
                    placeholder="Ex: 31 Octobre 2025"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Informations complémentaires aux invités</label>
                  <textarea
                    rows={2}
                    value={form.additionalInfo}
                    onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })}
                    placeholder="Ex: Tenue d'honneur, parking gardé, recommandations..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 leading-relaxed"
                  ></textarea>
                </div>
              </div>
            )}

            {/* Save & Update action */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-stone-500 text-[11px]">
                Enregistre et synchronise immédiatement le faire-part public.
              </span>

              <button
                type="button"
                onClick={() => handleSaveAll()}
                disabled={saving}
                className="px-6 py-3 rounded-2xl bg-[#C05638] text-white font-bold text-xs shadow-md hover:bg-[#A84429] transition-all flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: activeTheme.primary }}
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Sauvegarde..." : "Enregistrer les modifications"}</span>
              </button>
            </div>

          </div>

          {/* QR CODE DOWNLOAD CARD */}
          <div className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-20 h-20 rounded-xl border border-stone-200 p-1 bg-white shrink-0" />
              ) : (
                <QrCode className="w-12 h-12 text-[#C05638]" />
              )}
              <div className="space-y-0.5">
                <strong className="text-stone-900 font-serif text-sm block">QR Code Officiel</strong>
                <p className="text-stone-600">
                  À imprimer sur vos cartons d'invitation papier ou sur les programmes de messe.
                </p>
              </div>
            </div>

            {qrCodeDataUrl && (
              <a
                href={qrCodeDataUrl}
                download={`QR_Code_Mariage_${coupleSlug}.png`}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-[#C05638] text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger</span>
              </a>
            )}
          </div>
        </div>

        {/* RIGHT PANE: LIVE IMMERSIVE VERTICAL FAIRE-PART PREVIEW (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="flex items-center justify-between p-3 rounded-2xl glass-panel border border-stone-200 text-xs">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#C05638]" />
              <span className="font-bold text-stone-800">Aperçu Réel du Faire-Part</span>
              <span className="text-stone-400 text-[10px] hidden sm:inline">(Mise à jour instantanée)</span>
            </div>

            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  previewDevice === "mobile" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-500"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  previewDevice === "desktop" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-500"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Ordinateur</span>
              </button>
            </div>
          </div>

          {/* Device Viewport Simulation */}
          <div className="flex justify-center p-3 sm:p-6 rounded-3xl glass-panel border border-stone-200/90 shadow-md bg-[#FAF8F5]/80">
            {previewDevice === "mobile" ? (
              /* Realistic Smartphone Shell with Vertical Scroll */
              <div className="w-full max-w-[370px] rounded-[44px] p-2.5 bg-stone-950 shadow-2xl border-4 border-stone-800">
                <div className="w-20 h-4 bg-stone-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-3 h-1 bg-stone-700 rounded-full"></div>
                </div>
                <div className="rounded-[36px] overflow-hidden bg-white max-h-[740px] overflow-y-auto">
                  <DigitalInvitationExperience
                    slug={coupleSlug}
                    heroTitle={form.heroTitle}
                    subTitle={form.subTitle}
                    coupleNames={form.coupleNames}
                    weddingDate={form.weddingDate}
                    weddingTime={form.weddingTime}
                    city={form.city}
                    venueName={form.venueName}
                    venueAddress={form.venueAddress}
                    venueMapUrl={form.venueMapUrl}
                    customVerse={form.customVerse}
                    introText={form.introText}
                    loveStory={form.loveStory}
                    testimony={form.testimony}
                    pastorWord={form.pastorWord}
                    finalMessage={form.finalMessage}
                    rsvpDeadline={form.rsvpDeadline}
                    hasPhoto={form.hasPhoto}
                    heroImageUrl={form.heroImageUrl}
                    cardTemplate={form.cardTemplate}
                    sansPhotoStyle={form.sansPhotoStyle}
                    photoLayout={form.photoLayout}
                    photoZoom={form.photoZoom}
                    photoPositionX={form.photoPositionX}
                    photoPositionY={form.photoPositionY}
                    customPrimaryColor={form.customPrimaryColor || undefined}
                    customSecondaryColor={form.customSecondaryColor || undefined}
                    customAccentColor={form.customAccentColor || undefined}
                    customTextColor={form.customTextColor || undefined}
                    customFontFamily={form.customFontFamily || undefined}
                    customFontSize={form.customFontSize}
                    customTextAlign={form.customTextAlign}
                    showCountdown={form.showCountdown}
                    showStory={form.showStory}
                    showProgramme={form.showProgramme}
                    showLocations={form.showLocations}
                    showVerse={form.showVerse}
                    showRsvp={form.showRsvp}
                    showCagnotte={form.showCagnotte}
                    showQrCode={form.showQrCode}
                    cagnotteEnabled={form.cagnotteEnabled}
                    cagnotteTitle={form.cagnotteTitle}
                    cagnotteDescription={form.cagnotteDescription}
                    cagnottePaymentMethod={form.cagnottePaymentMethod}
                    cagnottePaymentUrl={form.cagnottePaymentUrl}
                    cagnotteButtonText={form.cagnotteButtonText}
                    ceremoniesSelected={form.ceremoniesSelected}
                    ceremoniesDetails={form.ceremoniesDetails}
                    dotDate={form.dotDate}
                    civilDate={form.civilDate}
                    churchDate={form.churchDate}
                    receptionDate={form.receptionDate}
                    additionalInfo={form.additionalInfo}
                    isInteractivePreview={true}
                  />
                </div>
              </div>
            ) : (
              /* Desktop Mode Presentation */
              <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl border border-stone-200 bg-white max-h-[820px] overflow-y-auto">
                <DigitalInvitationExperience
                  slug={coupleSlug}
                  heroTitle={form.heroTitle}
                  subTitle={form.subTitle}
                  coupleNames={form.coupleNames}
                  weddingDate={form.weddingDate}
                  weddingTime={form.weddingTime}
                  city={form.city}
                  venueName={form.venueName}
                  venueAddress={form.venueAddress}
                  venueMapUrl={form.venueMapUrl}
                  customVerse={form.customVerse}
                  introText={form.introText}
                  loveStory={form.loveStory}
                  testimony={form.testimony}
                  pastorWord={form.pastorWord}
                  finalMessage={form.finalMessage}
                  rsvpDeadline={form.rsvpDeadline}
                  hasPhoto={form.hasPhoto}
                  heroImageUrl={form.heroImageUrl}
                  cardTemplate={form.cardTemplate}
                  sansPhotoStyle={form.sansPhotoStyle}
                  photoLayout={form.photoLayout}
                  photoZoom={form.photoZoom}
                  photoPositionX={form.photoPositionX}
                  photoPositionY={form.photoPositionY}
                  customPrimaryColor={form.customPrimaryColor || undefined}
                  customSecondaryColor={form.customSecondaryColor || undefined}
                  customAccentColor={form.customAccentColor || undefined}
                  customTextColor={form.customTextColor || undefined}
                  customFontFamily={form.customFontFamily || undefined}
                  customFontSize={form.customFontSize}
                  customTextAlign={form.customTextAlign}
                  showCountdown={form.showCountdown}
                  showStory={form.showStory}
                  showProgramme={form.showProgramme}
                  showLocations={form.showLocations}
                  showVerse={form.showVerse}
                  showRsvp={form.showRsvp}
                  showCagnotte={form.showCagnotte}
                  showQrCode={form.showQrCode}
                  cagnotteEnabled={form.cagnotteEnabled}
                  cagnotteTitle={form.cagnotteTitle}
                  cagnotteDescription={form.cagnotteDescription}
                  cagnottePaymentMethod={form.cagnottePaymentMethod}
                  cagnottePaymentUrl={form.cagnottePaymentUrl}
                  cagnotteButtonText={form.cagnotteButtonText}
                  ceremoniesSelected={form.ceremoniesSelected}
                  ceremoniesDetails={form.ceremoniesDetails}
                  dotDate={form.dotDate}
                  civilDate={form.civilDate}
                  churchDate={form.churchDate}
                  receptionDate={form.receptionDate}
                  additionalInfo={form.additionalInfo}
                  isInteractivePreview={true}
                />
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 3. DÉTAIL DES RÉPONSES RSVP REÇUES */}
      <div ref={rsvpAnchorRef} className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C05638]" />
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              RÉPONSES RSVP REÇUES EN DIRECT
            </h3>
          </div>
          <span className="text-xs text-stone-500">
            Total : <strong>{rsvpStats.totalResponses} réponses</strong>
          </span>
        </div>

        <div className="space-y-3">
          {recentRsvps.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-xs text-stone-500">
              Aucune réponse RSVP enregistrée pour l'instant. Partagez votre lien de faire-part pour recevoir les confirmations de vos invités.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentRsvps.map((rsvp: any) => {
                const isConfirmed = rsvp.attendanceStatus === "confirmed" || (rsvp.attending && !rsvp.attendanceStatus);
                const isMaybe = rsvp.attendanceStatus === "maybe";
                return (
                  <div
                    key={rsvp.id}
                    className="p-4 rounded-2xl bg-white border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-stone-900 font-serif text-sm">{rsvp.guestName}</strong>
                        {rsvp.phone && <span className="text-stone-400">({rsvp.phone})</span>}
                        {rsvp.plusOnesCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            +{rsvp.plusOnesCount} accompagnant(s)
                          </span>
                        )}
                      </div>
                      {rsvp.messageForCouple && (
                        <p className="text-stone-600 italic">« {rsvp.messageForCouple} »</p>
                      )}
                      {rsvp.prayerWishes && (
                        <p className="text-[#C05638] font-serif text-[11px]">Prière : {rsvp.prayerWishes}</p>
                      )}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full font-bold text-[10px] shrink-0 ${
                        isConfirmed
                          ? "bg-emerald-100 text-emerald-800"
                          : isMaybe
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {isConfirmed ? "Présent(e) confirmé(e)" : isMaybe ? "En réflexion" : "Empêché(e)"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
