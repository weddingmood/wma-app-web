"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { OFFERS } from "@/lib/offers";
import FeaturedAmbassadors from "@/components/FeaturedAmbassadors";
import TestimonialsSection from "@/components/TestimonialsSection";
import {
  Heart,
  CheckCircle2,
  Sparkles,
  Calendar,
  Wallet,
  BookOpen,
  Gamepad2,
  Users,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  ExternalLink,
  X,
  Menu,
} from "lucide-react";
import {
  OFFICIAL_WHATSAPP_URL,
  OFFICIAL_WHATSAPP_NUMBER,
  OFFICIAL_WAVE_PAY_URL,
  WAVE_PAY_COUPLE_URL,
  WAVE_PAY_INDIVIDUAL_URL,
  PRICING_PLANS,
  COLOR_THEMES,
} from "@/lib/constants";

export default function LandingPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Login Form : email personnel + code d'accÃ¨s unique
  const [loginIdentifier, setLoginIdentifier] = useState("Ã‰poux@weddingmood.ci");
  const [loginAccessCode, setLoginAccessCode] = useState("WM-2025");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Code d'accÃ¨s gÃ©nÃ©rÃ© lors de l'inscription
  const [generatedAccessCode, setGeneratedAccessCode] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<"couple" | "individual">("couple");

  // Register Form
  const [regForm, setRegForm] = useState({
    partner1Name: "Ã‰poux Kouassi",
    partner2Name: "Ã‰pouse Yao",
    partner1Email: "",
    partner2Email: "",
    weddingDate: "2025-11-15",
    city: "Abidjan (Cocody)",
    venue: "Espace Nuptial Riviera Golf",
    totalBudget: "6500000",
    estimatedGuests: "250",
    church: "Ã‰glise Ã‰vangÃ©lique GrÃ¢ce et Vie",
    pastorName: "Pasteur Jean-Marc Kouadio",
    ethnicity: "BaoulÃ© & BÃ©tÃ©",
    password: "",
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          identifier: loginIdentifier,
          accessCode: loginAccessCode,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthModalOpen(false);
        router.push("/dashboard");
      } else {
        setAuthError(data.message || "Identifiants incorrects");
      }
    } catch {
      setAuthError("Erreur rÃ©seau");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          ...regForm,
          planType: selectedPlanId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Affiche le code d'accÃ¨s unique gÃ©nÃ©rÃ© automatiquement
        setGeneratedAccessCode(data.accessCode);
        setTimeout(() => {
          setIsAuthModalOpen(false);
          router.push("/dashboard");
        }, 6000);
      } else {
        setAuthError(data.message || "Erreur lors de l'inscription");
      }
    } catch {
      setAuthError("Erreur rÃ©seau");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-stone-900 font-sans selection:bg-[#C05638] selection:text-white">
      
      {/* Navigation Top Header with Glass Translucent Effect */}
            {/* Navigation Top Header with Glass Translucent Effect */}
      <nav className="sticky top-0 z-40 w-full glass-panel border-b border-stone-200/70 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size={48} showText={true} />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-stone-700">
            <a href="#vision" className="hover:text-[#C05638] transition-colors">Vision Pastorale</a>
            <a href="#modules" className="hover:text-[#C05638] transition-colors">Notre Mariage</a>
            <a href="#spirituel" className="hover:text-[#C05638] transition-colors">7 Themes Bibliques</a>
            <a href="#themes" className="hover:text-[#C05638] transition-colors">20 Palettes CI</a>
            <a href="#tarifs" className="hover:text-[#C05638] transition-colors">Abonnement Wave</a>
          </div>
          <div className="flex items-center gap-3">
            <a href={OFFICIAL_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Officiel</span>
            </a>
            <button onClick={() => { setAuthMode("login"); setIsAuthModalOpen(true); }} className="px-5 py-2.5 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer">
              <span className="hidden sm:inline">Acceder a Notre Espace</span><span className="sm:hidden">Espace</span><ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 cursor-pointer">
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white/95 backdrop-blur p-4 space-y-3">
            <a href="#vision" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-stone-700">Vision Pastorale</a>
            <a href="#modules" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-stone-700">Notre Mariage</a>
            <a href="#spirituel" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-stone-700">7 Themes Bibliques</a>
            <a href="#themes" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-stone-700">20 Palettes CI</a>
            <a href="#tarifs" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-stone-700">Abonnement Wave</a>
            <a href={OFFICIAL_WHATSAPP_URL} target="_blank" className="flex items-center gap-2 py-2 text-sm font-bold text-emerald-700"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden bg-gradient-to-b from-white via-[#FCFAF7] to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-[#C05638] text-xs font-bold border border-orange-100 shadow-2xs">
                <Sparkles className="w-4 h-4 text-[#C05638]" />
                <span>Application Premium de PrÃ©paration au Mariage en CÃ´te d'Ivoire</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-6xl font-bold tracking-tight text-stone-950 leading-[1.12]">
                BÃ¢tir votre mariage sur le <span className="text-[#C05638] font-bold">Roc</span>, du premier jour jusqu'au <span className="text-[#B37D28] font-bold">Jour J</span>.
              </h1>

              <p className="font-serif italic text-base sm:text-xl text-stone-600 max-w-2xl leading-relaxed">
                Â« La corde Ã  trois fils ne se rompt pas facilement. Â» (EcclÃ©siaste 4:12)
              </p>

              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-xl">
                L'espace privÃ© partagÃ© pour jeunes couples chrÃ©tiens de 19 ans et plus en CÃ´te d'Ivoire. Coordonnez la <strong>Dot CoutumiÃ¨re</strong>, le <strong>Mariage Civil</strong>, la <strong>BÃ©nÃ©diction Nuptiale</strong>, les dÃ©penses en FCFA, vos priÃ¨res et vos invitations en parfaite synchronisation.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white text-sm font-bold shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Heart className="w-5 h-5 fill-current" />
                  <span>Commencer l'Essai Gratuit (3 Jours)</span>
                </button>

                <button
                  onClick={() => {
                    setAuthMode("login");
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl glass-panel hover:bg-white border border-stone-200 text-stone-900 text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>DÃ©mo DÃ©jÃ  ConfigurÃ©e (Ã‰poux & Ã‰pouse)</span>
                </button>
              </div>

              {/* Badges / Assurances */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-stone-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  DonnÃ©es confidentielles et protÃ©gÃ©es
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C05638]" />
                  Synchronisation instantanÃ©e Elle & Lui
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#B37D28]" />
                  Fonctionnement continu hors connexion
                </span>
              </div>

            </div>

            {/* Right Column: Premium Luxury App Preview Card with Glass Translucency */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl glass-panel border border-white/80 shadow-2xl p-6 sm:p-8 space-y-6">
                
                {/* Emblem Header inside preview */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-3">
                    <Logo size={42} showText={false} />
                    <div>
                      <h4 className="font-serif font-bold text-stone-900 text-base leading-tight">Ã‰poux & Ã‰pouse</h4>
                      <span className="text-[10px] text-stone-500">Mariage : 15 Novembre 2025 (Abidjan)</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    SynchronisÃ©
                  </span>
                </div>

                {/* Progress bar */}
                <div className="p-4 rounded-2xl glass-card-warm border border-[#EAE2D5] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-600">Progression des PrÃ©paratifs</span>
                    <strong className="text-[#C05638] text-sm">64 %</strong>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-[#C05638] via-[#B37D28] to-emerald-600 h-full w-[64%] rounded-full"></div>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    J-90 : CÃ©rÃ©monie de Dot & Dossier Mairie validÃ©s.
                  </div>
                </div>

                {/* Quick 2 Partner Badges */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/80 border border-stone-200 text-center">
                    <span className="text-[10px] text-stone-400 block font-bold uppercase">Ã‰poux (Lui)</span>
                    <strong className="text-stone-900 block font-serif mt-0.5">Budget & Contrats</strong>
                    <span className="text-[10px] text-emerald-600 font-bold">4 tÃ¢ches faites</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 border border-stone-200 text-center">
                    <span className="text-[10px] text-stone-400 block font-bold uppercase">Ã‰pouse (Elle)</span>
                    <strong className="text-stone-900 block font-serif mt-0.5">Tenues & Traiteur</strong>
                    <span className="text-[10px] text-emerald-600 font-bold">5 tÃ¢ches faites</span>
                  </div>
                </div>

                {/* Dual Validation Alert */}
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <strong>Accord Conjoint :</strong> DÃ©pense supÃ©rieure Ã  50 000 FCFA validÃ©e Ã  deux d'un commun accord.
                  </div>
                </div>

                <button
                  onClick={() => {
                    setAuthMode("login");
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-[#C05638] transition-colors cursor-pointer"
                >
                  Ouvrir le Tableau de Bord en Direct
                </button>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4 PILLARS SECTION */}
      <section id="modules" className="py-20 bg-white border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-[#C05638]">
              Les Espaces Fondateurs
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-950">
              Tout ce dont votre couple a besoin en un lieu unique
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Wedding Mood structure l'organisation matÃ©rielle, l'Ã©dification spirituelle et la complicitÃ© du couple sans dispersion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. Notre Mariage */}
            <div className="p-6 rounded-3xl glass-card-warm border border-[#EAE2D5] space-y-4 hover:shadow-lg transition-all">
              <div className="p-3.5 rounded-2xl bg-orange-100 text-[#C05638] w-fit">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900">1. Notre Mariage</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Â« Que devons-nous prÃ©parer ? Â» : Dot traditionnelle, mariage civil, bÃ©nÃ©diction nuptiale, traiteur, photographe, rÃ©troplanning J-90 Ã  Jour J et budget transparent en FCFA.
              </p>
            </div>

            {/* 2. Nous Deux & Dieu */}
            <div id="spirituel" className="p-6 rounded-3xl glass-card-warm border border-[#EAE2D5] space-y-4 hover:shadow-lg transition-all">
              <div className="p-3.5 rounded-2xl bg-purple-100 text-purple-800 w-fit">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900">2. Nous Deux & Dieu</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Â« Comment grandissons-nous ensemble ? Â» : 7 thÃ¨mes bibliques d'Ã©dification pastorale, journal privÃ© de priÃ¨re, les 10 commandements d'alliance et dÃ©cisions Ã  double accord.
              </p>
            </div>

            {/* 3. Jeux & ComplicitÃ© */}
            <div className="p-6 rounded-3xl glass-card-warm border border-[#EAE2D5] space-y-4 hover:shadow-lg transition-all">
              <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-800 w-fit">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900">3. Espace Jeux</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Â« Comment passons-nous du temps ensemble ? Â» : AwalÃ© traditionnel, Ludo nuptial, BaccalaurÃ©at, QCM connaissances, situations rÃ©elles en CÃ´te d'Ivoire et score de complicitÃ©.
              </p>
            </div>

            {/* 4. Bon Ã  Savoir & InvitÃ©s */}
            <div className="p-6 rounded-3xl glass-card-warm border border-[#EAE2D5] space-y-4 hover:shadow-lg transition-all">
              <div className="p-3.5 rounded-2xl bg-blue-100 text-blue-800 w-fit">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900">4. InvitÃ©s & Bon Ã  Savoir</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Â« Qu'est-ce que nous devons comprendre ? Â» : Lois ivoiriennes 2019, guides de mairie, bibliothÃ¨que pastorale, gestion des invitÃ©s, badges d'accÃ¨s et site d'invitation RSVP.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 20 THEMES PREVIEW */}
      <section id="themes" className="py-20 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-[#C05638]">
              Personnalisation
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-950">
              20 ThÃ¨mes Royaux InspirÃ©s de Notre Pays
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm">
              Terracotta Royal, Or d'Abidjan, Ã‰meraude Ã‰ternelle, Perle d'Assinie, Ocre de Yamoussoukro... Choisissez la palette qui reflÃ¨te l'Ã¢me de votre couple.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {COLOR_THEMES.slice(0, 10).map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.primary }}></span>
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.secondary }}></span>
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.accent }}></span>
                </div>
                <h4 className="font-serif font-bold text-xs text-stone-900 truncate">{t.name}</h4>
                <span className="text-[10px] text-stone-400 block">{t.category}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* PRICING : 2 FORMULES WAVE MANUELLES */}
      <section id="tarifs" className="py-20 bg-white border-t border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-10">
          <div className="space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-[#C05638]">
              Tarifs Simples &amp; Transparents
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-950">
              Trois formules adapt&eacute;es &agrave; votre situation
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
              3 jours d&apos;essai gratuit sans engagement. R&egrave;glement direct via Wave C&ocirc;te d&apos;Ivoire, valid&eacute; par notre &eacute;quipe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {OFFERS.map((o) => (
              <div
                key={o.id}
                className={`relative p-7 rounded-3xl flex flex-col justify-between gap-6 transition-all ${
                  o.highlight
                    ? "bg-[#FFF7ED] border-[3px] border-[#C05638] shadow-xl"
                    : "bg-white border border-stone-200 shadow-sm"
                }`}
              >
                {o.highlight && (
                  <span className="absolute -top-3 left-6 text-[10px] font-bold px-3 py-1 rounded-full bg-[#C05638] text-white">
                    RECOMMAND&Eacute;E
                  </span>
                )}
                <div className="space-y-3">
                  <h3 className="font-serif font-bold text-stone-900 text-xl">{o.name}</h3>
                  <div className="font-serif text-4xl font-black text-stone-900">
                    {o.amount.toLocaleString("fr-FR")}{" "}
                    <span className="text-base font-normal text-stone-500">FCFA</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{o.tagline}</p>
                </div>
                <Link
                  href="/abonnement"
                  className={`w-full py-3 rounded-2xl font-bold text-xs text-center shadow-md transition-all ${
                    o.highlight ? "bg-[#C05638] text-white hover:opacity-90" : "bg-stone-900 text-white hover:bg-stone-800"
                  }`}
                >
                  Comparer et choisir
                </Link>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-[#D4AF37]/40 shadow-sm max-w-3xl mx-auto space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-[#B37D28]" />
              <h4 className="font-serif font-bold text-stone-900 text-lg">
                Un code d&apos;acc&egrave;s unique pour les deux partenaires
              </h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed max-w-xl mx-auto">
              D&egrave;s la cr&eacute;ation de votre espace, un code court et facile &agrave; retenir (par exemple <strong className="text-[#C05638] font-mono">WM-4821</strong>) est g&eacute;n&eacute;r&eacute; automatiquement. Chaque conjoint se connecte depuis son propre t&eacute;l&eacute;phone avec son adresse email personnelle et ce code partag&eacute;.
            </p>
            <p className="text-[11px] text-stone-500">
              Assistance et activation manuelle par WhatsApp :{" "}
              <a
                href={OFFICIAL_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-bold hover:underline"
              >
                {OFFICIAL_WHATSAPP_NUMBER}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER LUMINEUX & Ã‰LÃ‰GANT (AUCUN FOND SOMBRE) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10"><TestimonialsSection hideWhenEmpty /></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10"><FeaturedAmbassadors /></div>

      <section className="py-14 bg-[#FCFAF7] border-t border-stone-200">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-3">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Vous &ecirc;tes prestataire de mariage ?</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Traiteur, d&eacute;corateur, photographe&hellip; Inscrivez-vous gratuitement : votre fiche sera visible par les couples apr&egrave;s validation par notre &eacute;quipe.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <a href="/devenir-prestataire" className="inline-flex items-center px-5 py-2.5 rounded-2xl bg-[#C05638] text-white text-sm font-bold hover:opacity-90">Inscription gratuite</a>
            <a href="/marketplace" className="inline-flex items-center px-5 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-800 text-sm font-semibold hover:bg-stone-50">Voir les prestataires</a>
          </div>
        </div>
      </section>
      <footer className="bg-white text-stone-700 py-12 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <Logo size={42} showText={true} variant="dark" />
          </div>

          <div className="text-xs text-stone-500 text-center sm:text-right space-y-1">
            <p>Support WhatsApp Officiel : <a href={OFFICIAL_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-[#C05638] font-bold hover:underline">+225 70 50 13 56</a></p>
            <p>Â© 2025 Wedding Mood CÃ´te d'Ivoire. Tous droits rÃ©servÃ©s.</p>
          </div>
        </div>
      </footer>

      {/* AUTH MODAL (LOGIN / REGISTER) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 overflow-y-auto max-h-[92vh]">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Logo size={36} showText={false} />
                <h3 className="font-serif font-bold text-stone-900 text-lg">
                  {authMode === "login" ? "Connexion Ã  Notre Espace" : "CrÃ©er Notre Espace de Mariage"}
                </h3>
              </div>
              <button onClick={() => setIsAuthModalOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs text-center font-medium">
                {authError}
              </div>
            )}

            {/* CODE D'ACCÃˆS UNIQUE GÃ‰NÃ‰RÃ‰ APRÃˆS INSCRIPTION */}
            {generatedAccessCode && (
              <div className="p-5 rounded-3xl glass-card-warm border-2 border-[#D4AF37] shadow-md space-y-3 text-center animate-in fade-in">
                <Sparkles className="w-8 h-8 text-[#B37D28] mx-auto" />
                <h4 className="font-serif font-bold text-stone-900 text-base">
                  Votre espace est crÃ©Ã© avec succÃ¨s !
                </h4>
                <p className="text-[11px] text-stone-600">
                  Voici votre code d'accÃ¨s unique. Communiquez-le Ã  votre conjoint pour qu'il rejoigne l'espace avec son adresse email.
                </p>
                <div className="p-4 rounded-2xl bg-white border-2 border-[#C05638]/50">
                  <span className="font-serif font-black text-3xl tracking-widest text-[#C05638]">
                    {generatedAccessCode}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500">
                  Redirection automatique vers votre tableau de bord...
                </p>
              </div>
            )}

            {/* Toggle Login / Register */}
            <div className="flex bg-stone-100 p-1 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setAuthMode("login")}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  authMode === "login" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
                }`}
              >
                Se Connecter
              </button>
              <button
                onClick={() => setAuthMode("register")}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  authMode === "register" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
                }`}
              >
                Nouveau Couple (Essai 3j)
              </button>
            </div>

            {/* LOGIN FORM : Email personnel + Code d'accÃ¨s unique */}
            {authMode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Votre adresse email personnelle *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ã‰poux@exemple.ci"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Chaque partenaire utilise sa propre adresse email pour rejoindre l'espace partagÃ©.
                  </p>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Code d'accÃ¨s unique du couple *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : WM-2025"
                    value={loginAccessCode}
                    onChange={(e) => setLoginAccessCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-mono font-bold tracking-widest uppercase text-center text-base"
                  />
                </div>

                <div className="p-3 rounded-xl glass-card-warm border border-[#EAE2D5] text-[11px] text-stone-600 space-y-1">
                  <strong className="block text-stone-800">AccÃ¨s de dÃ©monstration :</strong>
                  <span className="block">Email : Ã‰poux@weddingmood.ci ou Ã‰pouse@weddingmood.ci</span>
                  <span className="block">Code d'accÃ¨s : <strong className="font-mono text-[#C05638]">WM-2025</strong></span>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {authLoading ? "Connexion..." : "Ouvrir Notre Espace Wedding Mood"}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {authMode === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                
                {/* Choix de la Formule d'Abonnement */}
                <div>
                  <label className="block text-stone-700 font-bold mb-1.5">
                    Formule d'accÃ¨s souhaitÃ©e *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPlanId("couple")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedPlanId === "couple"
                          ? "bg-[#C05638] text-white border-[#C05638] shadow-xs"
                          : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      <strong className="block font-bold">Formule Couple</strong>
                      <span className={`text-[10px] ${selectedPlanId === "couple" ? "text-white/90" : "text-stone-500"}`}>
                        3 000 FCFA, les 2 partenaires
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlanId("individual")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedPlanId === "individual"
                          ? "bg-[#C05638] text-white border-[#C05638] shadow-xs"
                          : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      <strong className="block font-bold">Formule Individuelle</strong>
                      <span className={`text-[10px] ${selectedPlanId === "individual" ? "text-white/90" : "text-stone-500"}`}>
                        2 000 FCFA, accÃ¨s personnel
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">PrÃ©nom & Nom (Lui) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ã‰poux Kouassi"
                      value={regForm.partner1Name}
                      onChange={(e) => setRegForm({ ...regForm, partner1Name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">PrÃ©nom & Nom (Elle) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ã‰pouse Yao"
                      value={regForm.partner2Name}
                      onChange={(e) => setRegForm({ ...regForm, partner2Name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Email du Partenaire 1 *</label>
                    <input
                      type="email"
                      required
                      placeholder="Ã‰poux@exemple.ci"
                      value={regForm.partner1Email}
                      onChange={(e) => setRegForm({ ...regForm, partner1Email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">
                      Email du Partenaire 2 {selectedPlanId === "couple" ? "*" : "(Optionnel)"}
                    </label>
                    <input
                      type="email"
                      required={selectedPlanId === "couple"}
                      placeholder="Ã‰pouse@exemple.ci"
                      value={regForm.partner2Email}
                      onChange={(e) => setRegForm({ ...regForm, partner2Email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Date PrÃ©vue du Mariage</label>
                    <input
                      type="date"
                      value={regForm.weddingDate}
                      onChange={(e) => setRegForm({ ...regForm, weddingDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Ã‰glise ou AssemblÃ©e</label>
                    <input
                      type="text"
                      placeholder="Ex: Ã‰glise GrÃ¢ce et Vie"
                      value={regForm.church}
                      onChange={(e) => setRegForm({ ...regForm, church: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl glass-card-warm border border-[#EAE2D5] text-[11px] text-stone-600">
                  Un <strong className="text-[#C05638]">code d'accÃ¨s unique</strong> sera gÃ©nÃ©rÃ© automatiquement Ã  la crÃ©ation de votre espace. Les deux partenaires s'en serviront avec leurs adresses email respectives.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Ville ou Commune en CÃ´te d'Ivoire</label>
                    <input
                      type="text"
                      placeholder="Ex: Abidjan (Cocody)"
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Budget EstimÃ© (FCFA)</label>
                    <input
                      type="number"
                      placeholder="Ex: 5000000"
                      value={regForm.totalBudget}
                      onChange={(e) => setRegForm({ ...regForm, totalBudget: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {authLoading ? "CrÃ©ation en cours..." : "CrÃ©er Notre Espace et GÃ©nÃ©rer Notre Code (Essai 3 Jours)"}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}





