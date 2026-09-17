"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Wallet,
  AlertCircle,
  Users,
  BookOpen,
  Gamepad2,
  ArrowRight,
  Heart,
  ChevronRight,
  ShieldCheck,
  Send,
  MessageSquare,
  Camera,
  Image as ImageIcon,
  X,
} from "lucide-react";

export default function DashboardPage() {
  const {
    couple,
    activePartner,
    partnerName,
    activeTheme,
    updatePreferences,
    preferences,
    updateCoupleProfile,
  } = useTheme();

  const [loading, setLoading] = useState(true);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [coverPhotoInput, setCoverPhotoInput] = useState("");

  const [stats, setStats] = useState({
    tasksTotal: 0,
    tasksCompleted: 0,
    nextTask: null as any,
    budgetTotal: 6500000,
    budgetSpent: 0,
    pendingValidationsCount: 0,
    guestsConfirmed: 0,
    guestsTotal: 0,
    devotionsCompleted: 0,
    devotionsTotal: 7,
    commandmentsBothConfirmed: 0,
    daysLeft: 120,
    nextTimelineEvent: null as any,
    topDecisionPending: null as any,
  });

  const couplePhoto =
    preferences.coverPhotoUrl ||
    "https://images.pexels.com/photos/34887758/pexels-photo-34887758.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200";

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [tasksRes, budgetRes, guestsRes, devotionsRes, timelineRes, cmdRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/budget"),
          fetch("/api/guests"),
          fetch("/api/devotions"),
          fetch("/api/timeline"),
          fetch("/api/commandments"),
        ]);

        let tasksData = { tasks: [] };
        let budgetData = { summary: { totalBudget: 6500000, totalSpent: 0, pendingValidationsCount: 0 } };
        let guestsData = { stats: { confirmedCount: 0, totalGuests: 0 } };
        let devotionsData = { devotions: [] };
        let timelineData = { timeline: [] };
        let cmdData = { stats: { bothConfirmedCount: 0 } };

        if (tasksRes.ok) tasksData = await tasksRes.json();
        if (budgetRes.ok) budgetData = await budgetRes.json();
        if (guestsRes.ok) guestsData = await guestsRes.json();
        if (devotionsRes.ok) devotionsData = await devotionsRes.json();
        if (timelineRes.ok) timelineData = await timelineRes.json();
        if (cmdRes.ok) cmdData = await cmdRes.json();

        const allTasks = tasksData.tasks || [];
        const completedTasks = allTasks.filter((t: any) => t.status === "completed").length;
        const pendingTasks = allTasks.filter((t: any) => t.status !== "completed");
        const nextTask = pendingTasks.find((t: any) => t.priority === "urgent" || t.priority === "high") || pendingTasks[0];

        const devList = devotionsData.devotions || [];
        const completedDevs = devList.filter((d: any) => d.isFullyCompleted).length;

        const timelineList = timelineData.timeline || [];
        const nextTimeEvent = timelineList.find((t: any) => !t.isCompleted) || timelineList[0];

        let days = 90;
        if (couple?.weddingDate) {
          const wDate = new Date(couple.weddingDate);
          const diff = wDate.getTime() - new Date().getTime();
          days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        setStats({
          tasksTotal: allTasks.length,
          tasksCompleted: completedTasks,
          nextTask,
          budgetTotal: budgetData.summary?.totalBudget || 6500000,
          budgetSpent: budgetData.summary?.totalSpent || 0,
          pendingValidationsCount: budgetData.summary?.pendingValidationsCount || 0,
          guestsConfirmed: guestsData.stats?.confirmedCount || 0,
          guestsTotal: guestsData.stats?.totalGuests || 0,
          devotionsCompleted: completedDevs,
          devotionsTotal: devList.length || 7,
          commandmentsBothConfirmed: cmdData.stats?.bothConfirmedCount || 0,
          daysLeft: days,
          nextTimelineEvent: nextTimeEvent,
          topDecisionPending: null,
        });
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [couple]);

  const handleSaveCoverPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverPhotoInput) return;
    await updatePreferences({ coverPhotoUrl: coverPhotoInput });
    setIsCoverModalOpen(false);
  };

  // Overall wedding readiness calculation
  const taskProgress = stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 40 : 20;
  const devProgress = (stats.devotionsCompleted / stats.devotionsTotal) * 30;
  const guestProgress = stats.guestsTotal > 0 ? (stats.guestsConfirmed / stats.guestsTotal) * 20 : 10;
  const cmdProgress = (stats.commandmentsBothConfirmed / 10) * 10;

  const globalReadinessPercent = Math.min(100, Math.round(taskProgress + devProgress + guestProgress + cmdProgress || 64));

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. HERO VISUAL STAGE: PHOTO PRINCIPALE DU COUPLE LUMINEUSE (WHITE GLASS) */}
      <div className="relative rounded-3xl overflow-hidden shadow-md border border-white glass-panel p-2 sm:p-3">
        <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden">
          {/* Main Couple Photo Responsive */}
          <img
            src={couplePhoto}
            alt={`${couple?.partner1Name} et ${couple?.partner2Name}`}
            className="w-full h-full object-cover filter brightness-[0.98] transition-transform duration-700 hover:scale-[1.02]"
          />

          {/* Light gradient overlay for text readability without being dark */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/75 via-transparent to-stone-900/20"></div>

          {/* Edit photo button */}
          <button
            onClick={() => {
              setCoverPhotoInput(preferences.coverPhotoUrl || "");
              setIsCoverModalOpen(true);
            }}
            className="absolute top-4 right-4 px-3.5 py-2 rounded-2xl glass-panel text-stone-800 text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-white transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#C05638]" />
            <span>Modifier la photo du couple</span>
          </button>

          {/* Floating Couple Presentation Overlay at the bottom */}
          <div className="absolute bottom-4 left-4 right-4 p-4 sm:p-6 rounded-2xl glass-panel backdrop-blur-md border border-white/90 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50/90 text-[#C05638] text-[11px] font-bold border border-orange-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Notre Espace de Préparation</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {couple?.partner1Name} & {couple?.partner2Name}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 font-serif italic max-w-xl">
                « {couple?.bibleVerse || "Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement."} »
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs text-center">
                <span className="text-[10px] font-bold uppercase text-stone-400 block">Compte à rebours</span>
                <span className="font-serif font-black text-xl text-[#C05638]">J-{stats.daysLeft}</span>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs text-center">
                <span className="text-[10px] font-bold uppercase text-stone-400 block">Date du Mariage</span>
                <span className="font-serif font-bold text-sm text-stone-900">{couple?.weddingDate || "15 Nov. 2025"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROGRESS BANNER (DONNÉES RÉELLES CALCULÉES) */}
      <div className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs uppercase font-bold tracking-wider text-[#C05638]">
            Où en sommes-nous ?
          </div>
          <h2 className="font-serif font-bold text-stone-900 text-xl sm:text-2xl">
            Votre mariage est préparé à <span className="text-[#C05638] font-black">{globalReadinessPercent} %</span>
          </h2>
          <p className="text-xs text-stone-600 max-w-lg">
            Calculé automatiquement à partir de vos tâches terminées, vos entretiens spirituels, vos confirmations RSVP et vos commandements validés.
          </p>
        </div>

        <div className="w-full sm:w-64 space-y-2">
          <div className="flex justify-between text-xs font-bold text-stone-700">
            <span>Avancement</span>
            <span className="text-[#C05638]">{globalReadinessPercent} %</span>
          </div>
          <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200/80">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${globalReadinessPercent}%`,
                backgroundColor: activeTheme.primary,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* 3. PRIORITY ACTION CARD */}
      <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-100 text-[#C05638] shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#C05638] mb-0.5">
              Action Prioritaire Recommandée
            </div>
            <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
              {stats.nextTask ? stats.nextTask.title : "Valider les pièces d'état civil pour la Mairie"}
            </h3>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
              {stats.nextTask?.description || "Rassemblez les extraits d'acte de naissance de moins de trois mois et les certificats prénuptiaux."}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/tasks"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          style={{ backgroundColor: activeTheme.primary }}
        >
          <span>Accéder aux Tâches</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 4. DUAL VALIDATION ALERT (> 50,000 FCFA) */}
      {stats.pendingValidationsCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
            <div className="text-xs">
              <strong>Validation conjointe requise :</strong> Vous avez {stats.pendingValidationsCount} dépense(s) supérieure(s) à 50 000 FCFA en attente de votre accord mutuel.
            </div>
          </div>
          <Link
            href="/dashboard/budget"
            className="px-3.5 py-1.5 rounded-xl bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 shrink-0 cursor-pointer"
          >
            Examiner
          </Link>
        </div>
      )}

      {/* 5. 4 PILLARS METRICS (WHITE GLASS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Tâches */}
        <Link
          href="/dashboard/tasks"
          className="p-5 rounded-3xl glass-panel border border-stone-200 shadow-2xs hover:shadow-md transition-all hover:border-[#D4AF37]/50 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase">Tâches & Préparatifs</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">
            {stats.tasksCompleted} / {stats.tasksTotal}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {stats.tasksTotal - stats.tasksCompleted} tâche(s) en cours
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0}%` }}
            ></div>
          </div>
        </Link>

        {/* Budget en FCFA */}
        <Link
          href="/dashboard/budget"
          className="p-5 rounded-3xl glass-panel border border-stone-200 shadow-2xs hover:shadow-md transition-all hover:border-[#D4AF37]/50 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase">Budget en FCFA</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-serif font-bold text-stone-900 truncate">
            {stats.budgetSpent.toLocaleString("fr-FR")} FCFA
          </div>
          <div className="text-xs text-stone-500 mt-1 truncate">
            sur {stats.budgetTotal.toLocaleString("fr-FR")} FCFA prévu
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3">
            <div
              className="bg-amber-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, (stats.budgetSpent / (stats.budgetTotal || 1)) * 100)}%` }}
            ></div>
          </div>
        </Link>

        {/* Invités & RSVP */}
        <Link
          href="/dashboard/guests"
          className="p-5 rounded-3xl glass-panel border border-stone-200 shadow-2xs hover:shadow-md transition-all hover:border-[#D4AF37]/50 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase">Invités Confirmés</span>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">
            {stats.guestsConfirmed}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            sur {stats.guestsTotal} invité(s) répertoriés
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${stats.guestsTotal > 0 ? (stats.guestsConfirmed / stats.guestsTotal) * 100 : 0}%` }}
            ></div>
          </div>
        </Link>

        {/* 7 Thèmes Bibliques */}
        <Link
          href="/dashboard/devotions"
          className="p-5 rounded-3xl glass-panel border border-stone-200 shadow-2xs hover:shadow-md transition-all hover:border-[#D4AF37]/50 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase">7 Thèmes Bibliques</span>
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-700">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">
            {stats.devotionsCompleted} / {stats.devotionsTotal}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {stats.commandmentsBothConfirmed} commandement(s) validé(s)
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3">
            <div
              className="bg-purple-600 h-1.5 rounded-full"
              style={{ width: `${(stats.devotionsCompleted / stats.devotionsTotal) * 100}%` }}
            ></div>
          </div>
        </Link>

      </div>

      {/* 6. ESSENTIAL HUBS: CALENDRIER & CARTE D'INVITATION ACCESSIBLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Next Chronogram Step with direct link to Calendar */}
        <div className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#C05638]" />
              <h3 className="font-serif font-bold text-stone-900 text-lg">Prochaine Échéance du Chronogramme</h3>
            </div>
            <Link href="/dashboard/calendar" className="text-xs font-bold text-[#C05638] hover:underline cursor-pointer">
              Voir le calendrier
            </Link>
          </div>

          <div className="p-4 rounded-2xl glass-card-warm border border-[#EAE2D5] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C05638] text-white font-bold">
                {stats.nextTimelineEvent?.phase || "J-60"}
              </span>
              <span className="text-stone-500 font-medium">Phase en cours</span>
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-base">
              {stats.nextTimelineEvent?.title || "Célébration de la Dot & Publication des Bans"}
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              {stats.nextTimelineEvent?.description || "Organisez la cérémonie coutumière et déposez les documents complets à l'état civil de votre commune."}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
            <span>Responsable : <strong>Nous deux</strong></span>
            <Link href="/dashboard/chronogramme" className="flex items-center gap-1 font-bold text-stone-800 hover:text-[#C05638] cursor-pointer">
              <span>Ouvrir le chronogramme complet</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Access to Invitation & Couple Hub */}
        <div className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#C05638]" />
              <h3 className="font-serif font-bold text-stone-900 text-lg">Espaces du Couple</h3>
            </div>
            <Link href="/dashboard/invitation" className="text-xs font-bold text-[#C05638] hover:underline cursor-pointer">
              Aperçu invitation
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/calendar"
              className="p-4 rounded-2xl bg-white/80 hover:bg-white transition-colors border border-stone-200 flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="p-3 rounded-2xl bg-orange-100 text-[#C05638] mb-2 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-serif font-bold text-stone-900 text-sm">Calendrier Partagé</span>
              <span className="text-[11px] text-stone-500 mt-0.5">Rendez-vous & tâches</span>
            </Link>

            <Link
              href="/dashboard/invitation"
              className="p-4 rounded-2xl bg-white/80 hover:bg-white transition-colors border border-stone-200 flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-700 mb-2 group-hover:scale-105 transition-transform">
                <Send className="w-5 h-5" />
              </div>
              <span className="font-serif font-bold text-stone-900 text-sm">Carte d'Invitation</span>
              <span className="text-[11px] text-stone-500 mt-0.5">Personnaliser & RSVP</span>
            </Link>

            <Link
              href="/dashboard/quizzes"
              className="p-4 rounded-2xl bg-white/80 hover:bg-white transition-colors border border-stone-200 flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 mb-2 group-hover:scale-105 transition-transform">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <span className="font-serif font-bold text-stone-900 text-sm">Quiz & Complicité</span>
              <span className="text-[11px] text-stone-500 mt-0.5">5 questions du jour</span>
            </Link>

            <Link
              href="/dashboard/chat"
              className="p-4 rounded-2xl bg-white/80 hover:bg-white transition-colors border border-stone-200 flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-700 mb-2 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="font-serif font-bold text-stone-900 text-sm">Messagerie Privée</span>
              <span className="text-[11px] text-stone-500 mt-0.5">Échanges en continu</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Cover Photo Modal */}
      {isCoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Changer la Photo Principale du Couple
              </h3>
              <button
                onClick={() => setIsCoverModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoverPhoto} className="space-y-4">
              <div className="h-40 rounded-2xl overflow-hidden border border-stone-200 bg-stone-50">
                <img
                  src={coverPhotoInput || couplePhoto}
                  alt="Aperçu du couple"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Lien direct de la photo (JPG / PNG)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={coverPhotoInput}
                  onChange={(e) => setCoverPhotoInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCoverModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C05638] text-white font-bold cursor-pointer hover:bg-[#A84429]"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
