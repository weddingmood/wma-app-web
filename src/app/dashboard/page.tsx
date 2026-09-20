"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import { fileToCompressedDataUrl } from "@/lib/image-upload";
import {
  Users,
  Wallet,
  CheckSquare,
  Gamepad2,
  AlertCircle,
  ArrowRight,
  Camera,
} from "lucide-react";

interface DashTask {
  id: number | string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  dueDate?: string | null;
}

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800";
const DEFAULT_VERSE =
  "Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement.";
const PRIORITY_RANK: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function parseWeddingDate(value?: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function Countdown({ target }: { target: Date }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (now !== null && target.getTime() - now <= 0) {
    const sameDay = new Date(now).toDateString() === target.toDateString();
    return (
      <p className="text-sm font-bold text-amber-700 py-2">
        {sameDay ? "C'est le grand jour ♥" : "Félicitations aux mariés ♥"}
      </p>
    );
  }

  const diff = now === null ? 0 : target.getTime() - now;
  const cells = [
    { label: "Jours", value: now === null ? "--" : String(Math.floor(diff / 86400000)) },
    { label: "Heures", value: now === null ? "--" : pad(Math.floor(diff / 3600000) % 24) },
    { label: "Min", value: now === null ? "--" : pad(Math.floor(diff / 60000) % 60) },
    { label: "Sec", value: now === null ? "--" : pad(Math.floor(diff / 1000) % 60) },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {cells.map((c) => (
        <div
          key={c.label}
          className="bg-stone-50 p-2 rounded-lg border border-stone-200 text-center"
        >
          <span className="text-lg font-black text-amber-600 tabular-nums block leading-6">
            {c.value}
          </span>
          <span className="text-[9px] font-semibold text-stone-400 block uppercase">
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardHome() {
  const { couple, updateCoupleProfile } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<DashTask[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tasks");
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      } catch {
        // Hors connexion : on garde simplement la liste vide
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const couplePhoto = couple?.coverPhoto || DEFAULT_PHOTO;
  const names =
    couple?.partner1Name && couple?.partner2Name
      ? couple.partner1Name + " & " + couple.partner2Name
      : "Notre mariage";
  const verse = couple?.bibleVerse || DEFAULT_VERSE;
  const target = useMemo(
    () => parseWeddingDate(couple?.weddingDate),
    [couple?.weddingDate]
  );

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "completed").length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const nextTask = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "completed")
      .sort(
        (a, b) =>
          (PRIORITY_RANK[a.priority ?? "medium"] ?? 2) -
            (PRIORITY_RANK[b.priority ?? "medium"] ?? 2) ||
          String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999"))
      )[0];
  }, [tasks]);

  let actionTitle = "Créez votre première tâche";
  let actionText = "Organisez votre mariage étape par étape.";
  if (nextTask) {
    actionTitle = nextTask.title;
    actionText =
      nextTask.description ||
      (nextTask.dueDate ? "À faire avant le " + nextTask.dueDate : "Tâche prioritaire");
  } else if (total > 0) {
    actionTitle = "Tout est terminé ♥";
    actionText = "Toutes vos tâches sont accomplies. Ajoutez-en si besoin.";
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file, { maxSize: 1200, quality: 0.8 });
      await updateCoupleProfile({ coverPhoto: dataUrl });
    } catch (err) {
      console.error(err);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 px-3 py-4 sm:px-6 max-w-md md:max-w-3xl mx-auto space-y-4 overflow-x-hidden pb-20">
      {/* Input de fichier masqué pour la sélection locale */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* 1. PHOTO DU COUPLE : plein cadre, rien par-dessus */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-md bg-stone-900 h-[56vh] min-h-[340px] max-h-[520px]">
        <img
          src={couplePhoto}
          alt="Photo du couple"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_PHOTO;
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-800 bg-white/85 backdrop-blur px-3 py-1.5 rounded-full shadow hover:bg-white transition cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Modifier la photo</span>
        </button>

        <h1 className="absolute bottom-4 left-4 right-4 z-10 text-2xl font-extrabold text-white drop-shadow">
          {names}
        </h1>
      </div>

      {/* 2. CALENDRIER : séparé de la photo */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm text-center space-y-3">
        <p className="text-[10px] font-semibold text-amber-700 tracking-wider uppercase">
          Notre Espace de Préparation
        </p>
        <p className="text-[11px] italic text-stone-600 px-1">{verse}</p>

        <div className="pt-1 space-y-2">
          <p className="text-[10px] font-semibold text-stone-400 uppercase">
            <span className="inline-block text-rose-400 animate-pulse mr-1">♥</span>
            Compte à rebours
          </p>
          {target ? (
            <>
              <Countdown target={target} />
              <p className="text-xs font-bold text-stone-800">
                {target.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </>
          ) : (
            <p className="text-xs text-stone-500">Date du mariage à définir</p>
          )}
        </div>
      </div>

      {/* 3. PROGRESSION DE PRÉPARATION */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2">
        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
          Où en sommes-nous ?
        </p>
        <h2 className="text-base font-extrabold text-stone-900">
          Votre mariage est préparé à{" "}
          <span className="text-amber-600">{percent} %</span>
        </h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          Calculé automatiquement à partir de vos tâches terminées.
        </p>

        <div className="pt-2">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-stone-600">Avancement</span>
            <span className="text-amber-600">{percent}%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all duration-500"
              style={{ width: percent + "%" }}
            ></div>
          </div>
        </div>
      </div>

      {/* 4. ACTION PRIORITAIRE RECOMMANDÉE */}
      <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
              Action prioritaire recommandée
            </p>
            <h3 className="text-sm font-bold text-stone-900">{actionTitle}</h3>
          </div>
        </div>
        <p className="text-xs text-stone-600">{actionText}</p>
        <Link
          href="/dashboard/tasks"
          className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
        >
          Accéder aux Tâches <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 5. RACCOURCIS MODULES DU DASHBOARD */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/dashboard/tasks"
          className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-amber-300 transition flex items-center gap-3"
        >
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-xs">Tâches</h3>
            <p className="text-[10px] text-stone-500">
              {done} / {total} terminées
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/guests"
          className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-amber-300 transition flex items-center gap-3"
        >
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-xs">Invités & RSVP</h3>
            <p className="text-[10px] text-stone-500">Liste & Présences</p>
          </div>
        </Link>

        <Link
          href="/dashboard/cagnotte"
          className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-amber-300 transition flex items-center gap-3"
        >
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-xs">Cagnotte</h3>
            <p className="text-[10px] text-stone-500">Gestion des dons</p>
          </div>
        </Link>

        <Link
          href="/dashboard/jeux"
          className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-amber-300 transition flex items-center gap-3"
        >
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-xs">Jeux Duo & Invités</h3>
            <p className="text-[10px] text-stone-500">Espace partagé</p>
          </div>
        </Link>
      </div>
    </div>
  );
}