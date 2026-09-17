"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedPartner, setSelectedPartner] = useState<"partner1" | "partner2">("partner1");

  // Login Form : email personnel + code d'accès unique
  const [loginIdentifier, setLoginIdentifier] = useState("david@weddingmood.ci");
  const [loginAccessCode, setLoginAccessCode] = useState("WM-2025");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Code d'accès généré lors de l'inscription
  const [generatedAccessCode, setGeneratedAccessCode] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<"couple" | "individual">("couple");

  // Register Form
  const [regForm, setRegForm] = useState({
    partner1Name: "David Kouassi",
    partner2Name: "Ruth Yao",
    partner1Email: "",
    partner2Email: "",
    weddingDate: "2025-11-15",
    city: "Abidjan (Cocody)",
    venue: "Espace Nuptial Riviera Golf",
    totalBudget: "6500000",
    estimatedGuests: "250",
    church: "Église Évangélique Grâce et Vie",
    pastorName: "Pasteur Jean-Marc Kouadio",
    ethnicity: "Baoulé & Bété",
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
          selectedPartner,
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
      setAuthError("Erreur réseau");
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
        // Affiche le code d'accès unique généré automatiquement
        setGeneratedAccessCode(data.accessCode);
        setTimeout(() => {
          setIsAuthModalOpen(false);
          router.push("/dashboard");
        }, 6000);
      } else {
        setAuthError(data.message || "Erreur lors de l'inscription");
      }
    } catch {
      setAuthError("Erreur réseau");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-stone-900 font-sans selection:bg-[#C05638] selection:text-white">
      
      {/* Navigation Top Header with Glass Translucent Effect */}
      <nav className="sticky top-0 z-40 w-full glass-panel border-b border-stone-200/70 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size={48} showText={true} />
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-stone-700">
            <a href="#vision" className="hover:text-[#C05638] transition-colors">Vision Pastorale</a>
            <a href="#modules" className="hover:text-[#C05638] transition-colors">Notre Mariage</a>
            <a href="#spirituel" className="hover:text-[#C05638] transition-colors">7 Thèmes Bibliques</a>
            <a href="#themes" className="hover:text-[#C05638] transition-colors">20 Palettes CI</a>
            <a href="#tarifs" className="hover:text-[#C05638] transition-colors">Abonnement Wave</a>
          </div>

          {/* Right Action CTA */}
          <div className="flex items-center gap-3">
            <a
              href={OFFICIAL_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Officiel</span>
            </a>

            <button
              onClick={() => {
                setAuthMode("login");
                setIsAuthModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Accéder à Notre Espace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden bg-gradient-to-b from-white via-[#FCFAF7] to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-[#C05638] text-xs font-bold border border-orange-100 shadow-2xs">
                <Sparkles className="w-4 h-4 text-[#C05638]" />
                <span>Application Premium de Préparation au Mariage en Côte d'Ivoire</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-6xl font-bold tracking-tight text-stone-950 leading-[1.12]">
                Bâtir votre mariage sur le <span className="text-[#C05638] font-bold">Roc</span>, du premier jour jusqu'au <span className="text-[#B37D28] font-bold">Jour J</span>.
              </h1>

              <p className="font-serif italic text-base sm:text-xl text-stone-600 max-w-2xl leading-relaxed">
                « La corde à trois fils ne se rompt pas facilement. » (Ecclésiaste 4:12)
              </p>

              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-xl">
                L'espace privé partagé pour jeunes couples chrétiens de 19 ans et plus en Côte d'Ivoire. Coordonnez la <strong>Dot Coutumière</strong>, le <strong>Mariage Civil</strong>, la <strong>Bénédiction Nuptiale</strong>, les dépenses en FCFA, vos prières et vos invitations en parfaite synchronisation.
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
                  <span>Démo Déjà Configurée (David & Ruth)</span>
                </button>
              </div>

              {/* Badges / Assurances */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-stone-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Données confidentielles et protégées
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C05638]" />
                  Synchronisation instantanée Elle & Lui
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
                      <h4 className="font-serif font-bold text-stone-900 text-base leading-tight">David & Ruth</h4>
                      <span className="text-[10px] text-stone-500">Mariage : 15 Novembre 2025 (Abidjan)</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    Synchronisé
                  </span>
                </div>

                {/* Progress bar */}
                <div className="p-4 rounded-2xl glass-card-warm border border-[#EAE2D5] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-600">Progression des Préparatifs</span>
                    <strong className="text-[#C05638] text-sm">64 %</strong>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-[#C05638] via-[#B37D28] to-emerald-600 h-full w-[64%] rounded-full"></div>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    J-90 : Cérémonie de Dot & Dossier Mairie validés.
                  </div>
                </div>

                {/* Quick 2 Partner Badges */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/80 border border-stone-200 text-center">
                    <span className="text-[10px] text-stone-400 block font-bold uppercase">David (Lui)</span>
                    <strong className="text-stone-900 block font-serif mt-0.5">Budget & Contrats</strong>
                    <span className="text-[10px] text-emerald-600 font-bold">4 tâches faites</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 border border-stone-200 text-center">
                    <span className="text-[10px] text-stone-400 block font-bold uppercase">Ruth (Elle)</span>
                    <strong className="text-stone-900 block font-serif mt-0.5">Tenues & Traiteur</strong>
                    <span className="text-[10px] text-emerald-600 font-bold">5 tâches faites</span>
                  </div>
                </div>

                {/* Dual Validation Alert */}
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <strong>Accord Conjoint :</strong> Dépense supérieure à 50 000 FCFA validée à deux d'un commun accord.
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
              Wedding Mood structure l'organisation matérielle, l'édification spirituelle et la complicité du couple sans dispersion.
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
                « Que devons-nous préparer ? » : Dot traditionnelle, mariage civil, bénédiction nuptiale, traiteur, photographe, rétroplanning J-90 à Jour J et budget transparent en FCFA.
              </p>
            </div>

            {/* 2. Nous Deux & Dieu */}
            <div id="spirituel" className="p-6 rounded-3xl glass-card-warm border border-[#EAE2D5] space-y-4 hover:shadow-lg transition-all">
              <div className="p-3.5 rounded-2xl bg-purple-100 text-purple-800 w-fit">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900">2. Nous Deux & Dieu</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                « Comment grandissons-nous ensemble ? » : 7 thèmes bibliques d'édification pastorale, journal privé de prière, les 10 commandements d'alliance et décisions à double accord.
              </p>
            </div>

            {/* 3. Jeux & Complicité */}
            <div className="p-6 rounded-3xl glass-card-warm border border-[#EAE2D5] space-y-4 hover:shadow-lg transition-all">
              <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-800 w-fit">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900">3. Espace Jeux</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                « Comment passons-nous du temps ensemble ? » : Awalé traditionnel, Ludo nuptial, Baccalauréat, QCM connaissances, situations réelles en Côte d'Ivoire et score de complicité.
              </p>
            </div>

            {/* 4. Bon à Savoir & Invités */}
            <div className="p-6 rounded-3xl glass-card-warm border border-[#EAE2D5] space-y-4 hover:shadow-lg transition-all">
              <div className="p-3.5 rounded-2xl bg-blue-100 text-blue-800 w-fit">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900">4. Invités & Bon à Savoir</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                « Qu'est-ce que nous devons comprendre ? » : Lois ivoiriennes 2019, guides de mairie, bibliothèque pastorale, gestion des invités, badges d'accès et site d'invitation RSVP.
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
              20 Thèmes Royaux Inspirés de Notre Pays
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm">
              Terracotta Royal, Or d'Abidjan, Émeraude Éternelle, Perle d'Assinie, Ocre de Yamoussoukro... Choisissez la palette qui reflète l'âme de votre couple.
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
              Tarifs Simples & Transparents
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-950">
              Deux formules adaptées à votre situation
            </h2>

            <p className="text-stone-600 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
              3 jours d'essai gratuit sans engagement. Règlement manuel direct via Wave Côte d'Ivoire, validé par notre équipe. Un code d'accès unique est généré automatiquement pour connecter les deux partenaires.
            </p>
          </div>

          {/* Les 2 cartes tarifaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`p-8 rounded-3xl shadow-xl space-y-6 flex flex-col justify-between transition-all ${
                  plan.isRecommended
                    ? "glass-card-warm border-2 border-[#C05638] ring-2 ring-[#C05638]/20"
                    : "glass-panel border-2 border-stone-200"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {plan.id === "couple" ? (
                        <Users className="w-5 h-5 text-[#C05638]" />
                      ) : (
                        <Heart className="w-5 h-5 text-stone-600" />
                      )}
                      <h3 className="font-serif font-bold text-stone-900 text-xl">{plan.name}</h3>
                    </div>
                    {plan.isRecommended && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#C05638] text-white shadow-xs shrink-0">
                        Recommandée
                      </span>
                    )}
                  </div>

                  <div className="font-serif text-5xl font-black text-stone-900">
                    {plan.amount.toLocaleString("fr-FR")}{" "}
                    <span className="text-lg font-normal text-stone-500">FCFA</span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">{plan.description}</p>

                  <div className="space-y-2 pt-1">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-stone-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <a
                  href={plan.payUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Payer {plan.amount.toLocaleString("fr-FR")} FCFA sur Wave</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          {/* Explication du code d'accès unique */}
          <div className="p-6 rounded-3xl glass-panel border border-[#D4AF37]/40 shadow-sm max-w-3xl mx-auto space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-[#B37D28]" />
              <h4 className="font-serif font-bold text-stone-900 text-lg">
                Un code d'accès unique pour les deux partenaires
              </h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed max-w-xl mx-auto">
              Dès la création de votre espace, un code court et facile à retenir (par exemple <strong className="text-[#C05638] font-mono">WM-4821</strong>) est généré automatiquement. Chaque conjoint se connecte depuis son propre téléphone avec son adresse email personnelle et ce code partagé.
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

      {/* FOOTER LUMINEUX & ÉLÉGANT (AUCUN FOND SOMBRE) */}
      <footer className="bg-white text-stone-700 py-12 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <Logo size={42} showText={true} variant="dark" />
          </div>

          <div className="text-xs text-stone-500 text-center sm:text-right space-y-1">
            <p>Support WhatsApp Officiel : <a href={OFFICIAL_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-[#C05638] font-bold hover:underline">+225 70 50 13 56</a></p>
            <p>© 2025 Wedding Mood Côte d'Ivoire. Tous droits réservés.</p>
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
                  {authMode === "login" ? "Connexion à Notre Espace" : "Créer Notre Espace de Mariage"}
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

            {/* CODE D'ACCÈS UNIQUE GÉNÉRÉ APRÈS INSCRIPTION */}
            {generatedAccessCode && (
              <div className="p-5 rounded-3xl glass-card-warm border-2 border-[#D4AF37] shadow-md space-y-3 text-center animate-in fade-in">
                <Sparkles className="w-8 h-8 text-[#B37D28] mx-auto" />
                <h4 className="font-serif font-bold text-stone-900 text-base">
                  Votre espace est créé avec succès !
                </h4>
                <p className="text-[11px] text-stone-600">
                  Voici votre code d'accès unique. Communiquez-le à votre conjoint pour qu'il rejoigne l'espace avec son adresse email.
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

            {/* LOGIN FORM : Email personnel + Code d'accès unique */}
            {authMode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Votre adresse email personnelle *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="david@exemple.ci"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Chaque partenaire utilise sa propre adresse email pour rejoindre l'espace partagé.
                  </p>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Code d'accès unique du couple *
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
                  <strong className="block text-stone-800">Accès de démonstration :</strong>
                  <span className="block">Email : david@weddingmood.ci ou ruth@weddingmood.ci</span>
                  <span className="block">Code d'accès : <strong className="font-mono text-[#C05638]">WM-2025</strong></span>
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
                    Formule d'accès souhaitée *
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
                        2 000 FCFA, accès personnel
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Prénom & Nom (Lui) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: David Kouassi"
                      value={regForm.partner1Name}
                      onChange={(e) => setRegForm({ ...regForm, partner1Name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Prénom & Nom (Elle) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ruth Yao"
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
                      placeholder="david@exemple.ci"
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
                      placeholder="ruth@exemple.ci"
                      value={regForm.partner2Email}
                      onChange={(e) => setRegForm({ ...regForm, partner2Email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Date Prévue du Mariage</label>
                    <input
                      type="date"
                      value={regForm.weddingDate}
                      onChange={(e) => setRegForm({ ...regForm, weddingDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Église ou Assemblée</label>
                    <input
                      type="text"
                      placeholder="Ex: Église Grâce et Vie"
                      value={regForm.church}
                      onChange={(e) => setRegForm({ ...regForm, church: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl glass-card-warm border border-[#EAE2D5] text-[11px] text-stone-600">
                  Un <strong className="text-[#C05638]">code d'accès unique</strong> sera généré automatiquement à la création de votre espace. Les deux partenaires s'en serviront avec leurs adresses email respectives.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Ville ou Commune en Côte d'Ivoire</label>
                    <input
                      type="text"
                      placeholder="Ex: Abidjan (Cocody)"
                      value={regForm.city}
                      onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Budget Estimé (FCFA)</label>
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
                  {authLoading ? "Création en cours..." : "Créer Notre Espace et Générer Notre Code (Essai 3 Jours)"}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
