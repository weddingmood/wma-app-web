"use client";

import React, { useState } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  HeartHandshake,
  Landmark,
  Church,
  PartyPopper,
  Users,
  FileCheck,
  Music,
  Camera,
  Utensils,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function NotreMariagePage() {
  const { couple, activeTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"dot" | "civil" | "eglise" | "reception">("dot");

  const ceremonies = [
    {
      id: "dot",
      title: "1. Dot Traditionnelle",
      subtitle: "Alliance des Familles Coutumières",
      icon: HeartHandshake,
      color: "from-amber-700 to-orange-800",
      description: "Le respect des coutumes ivoiriennes sanctifiées en Christ. Négociation honorifique, pagnes kita, présents d'honneur et repas fraternel.",
      checklist: [
        "Harmonisation préalable de la liste de dot avec les patriarches",
        "Désignation du porte-parole chrétien de la délégation",
        "Achat des pagnes kita traditionnels et présents honorifiques",
        "Préparation du menu traditionnel (Attiéké, poisson braisé, Alloco)",
        "Temps de prière d'ouverture et de bénédiction des anciens",
      ],
      practicalAdvice: "Restez dans la modération financière et veillez à sanctifier tous les dons par la prière pour glorifier Dieu.",
    },
    {
      id: "civil",
      title: "2. Mariage Civil",
      subtitle: "Légalité & Protection du Foyer (Loi n° 2019-570)",
      icon: Landmark,
      color: "from-blue-700 to-indigo-900",
      description: "L'engagement solennel devant l'Officier de l'État Civil de votre commune. Définition du régime matrimonial et délivrance du Livret de Famille.",
      checklist: [
        "Retrait et constitution du dossier d'état civil complet",
        "Bilan médical prénuptial (sérologies, électrophorèse AS/AA)",
        "Choix des 2 témoins majeurs et photocopies certifiées de leurs CNI",
        "Dépôt du dossier et affichage des bans légaux pendant 10 jours",
        "Validation du régime matrimonial (Communauté légale ou Séparation de biens)",
      ],
      practicalAdvice: "Réservez votre horaire de passage au moins 3 mois à l'avance auprès du service d'état civil de la mairie.",
    },
    {
      id: "eglise",
      title: "3. Bénédiction Nuptiale",
      subtitle: "Alliance Sacrée devant le Christ & l'Assemblée",
      icon: Church,
      color: "from-emerald-700 to-teal-900",
      description: "Le culte solennel de consécration de votre union. Échange des vœux et des alliances, prédication pastorale et sainte cène des mariés.",
      checklist: [
        "Entretien prénuptial et validation pastorale (8 à 12 séances)",
        "Validation de l'ordre de culte avec le Pasteur et le Maître de Cérémonie",
        "Choix des chantres et répétition des chants de louange avec la chorale",
        "Répétition générale du cortège (cortège des garçons et demoiselles d'honneur)",
        "Gravure sacrée des alliances (Ecclésiaste 4:12)",
      ],
      practicalAdvice: "Confiez l'accueil et le protocole à des frères et sœurs de confiance pour garder l'assemblée recueillie.",
    },
    {
      id: "reception",
      title: "4. Grande Réception & Banquet",
      subtitle: "Célébration, Partage & Mur de Bénédictions",
      icon: PartyPopper,
      color: "from-[#C05638] to-[#9C4123]",
      description: "Le banquet de noce réunissant les familles, amis et frères en Christ. Buffet ivoirien d'exception, animation gospel live et félicitations.",
      checklist: [
        "Validation du plan de table et attribution des groupes (Famille, VIP, Chorale...)",
        "Coordination du traiteur et dégustation préalable du menu",
        "Mise en place de la sono, de l'éclairage et du pupitre pour les allocutions",
        "Installation du Mur de Bénédictions Live sur écran géant (Wedding Mood)",
        "Gestion du gâteau nuptial et des rafraîchissements",
      ],
      practicalAdvice: "Prévoyez un coordonnateur logistique dédié pour soulager les mariés et leurs témoins pendant tout le banquet.",
    },
  ];

  const currentCeremony = ceremonies.find((c) => c.id === activeTab) || ceremonies[0];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Espace Central « Notre Mariage »</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Que devons-nous préparer pour chaque cérémonie ?
        </h1>
        <p className="text-stone-600 text-sm max-w-3xl leading-relaxed">
          En Côte d'Ivoire, le mariage chrétien réunit harmonieusement la Dot Coutumière, le Mariage Civil républicain, la Bénédiction Nuptiale en église et la Réception festive. Suivez ici chaque pilier pas à pas.
        </p>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
          {ceremonies.map((c) => {
            const isActive = activeTab === c.id;
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id as any)}
                className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? "bg-[#C05638] text-white shadow-md font-bold"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200"
                }`}
                style={isActive ? { backgroundColor: activeTheme.primary } : {}}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Ceremony Detail Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Details & Checklist */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#C05638] font-bold">
                  {currentCeremony.subtitle}
                </span>
                <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                  {currentCeremony.title}
                </h2>
              </div>
              <div className="p-3 rounded-2xl bg-orange-50 text-[#C05638]">
                <currentCeremony.icon className="w-6 h-6" />
              </div>
            </div>

            <p className="text-sm text-stone-700 leading-relaxed">
              {currentCeremony.description}
            </p>

            {/* Checklist */}
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Checklist Indispensable pour cette Cérémonie
              </h3>
              <div className="space-y-2.5">
                {currentCeremony.checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#EAE2D5] text-xs text-stone-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pastoral / Practical Advice */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Conseil de Sagesse Pastorale :</strong>
                {currentCeremony.practicalAdvice}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Card: Couple Specific Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-100 pb-3">
              Informations de Notre Couple
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-stone-500 block mb-0.5">Commune & Ville</span>
                <strong className="text-stone-900 text-sm">{couple?.city || "Abidjan (Cocody)"}</strong>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-stone-500 block mb-0.5">Église & Bénédiction</span>
                <strong className="text-stone-900 text-sm">{couple?.church || "Église Évangélique Grâce et Vie"}</strong>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-stone-500 block mb-0.5">Pasteur Référent</span>
                <strong className="text-stone-900 text-sm">{couple?.pastorName || "Pasteur Jean-Marc Kouadio"}</strong>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-stone-500 block mb-0.5">Ethnies & Traditions</span>
                <strong className="text-stone-900 text-sm">{couple?.ethnicity || "Baoulé & Bété"}</strong>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard/tasks"
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                <span>Gérer les Tâches de cette Cérémonie</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

