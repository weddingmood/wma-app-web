"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  Sparkles,
  Clock,
  Heart,
  CheckCircle2,
  Tv,
  Phone,
  Plus,
  X,
  Volume2,
} from "lucide-react";

export default function JourJPage() {
  const { couple, activeTheme } = useTheme();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [blessings, setBlessings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveWallOpen, setIsLiveWallOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const [isBlessingModalOpen, setIsBlessingModalOpen] = useState(false);
  const [blessingForm, setBlessingForm] = useState({
    senderName: "",
    senderRelation: "Famille",
    blessingText: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/day-j");
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setSchedule(d.schedule || []);
          setBlessings(d.blessings || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Slideshow auto-advance for big screen live wall
  useEffect(() => {
    if (!isLiveWallOpen || blessings.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % blessings.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isLiveWallOpen, blessings.length]);

  const handleToggleSchedule = async (id: number, curr: boolean) => {
    try {
      await fetch("/api/day-j", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "schedule_item", id, isCompleted: !curr }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBlessing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blessingForm.senderName || !blessingForm.blessingText) return;

    try {
      const res = await fetch("/api/day-j", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "blessing",
          ...blessingForm,
        }),
      });
      if (res.ok) {
        setIsBlessingModalOpen(false);
        setBlessingForm({ senderName: "", senderRelation: "Famille", blessingText: "" });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Centre de Contrôle du Grand Jour</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Espace Spécial Jour J
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">
            Chronogramme minute par minute, coordination du protocole et mur de bénédictions pour grand écran.
          </p>
        </div>

        <button
          onClick={() => setIsLiveWallOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
        >
          <Tv className="w-4 h-4 text-[#D4AF37]" />
          <span>Lancer le Mur Grand Écran</span>
        </button>
      </div>

      {/* Two Column Layout: Schedule & Blessings Wall Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Hour by hour schedule */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-100 pb-3">
              Déroulé Minute par Minute du Jour J
            </h3>

            <div className="space-y-3">
              {schedule.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    item.isCompleted
                      ? "bg-[#FCFAF7] border-emerald-200 opacity-80"
                      : "bg-stone-50 border-stone-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleSchedule(item.id, item.isCompleted)}
                      className={`p-1 rounded-lg border transition-colors shrink-0 mt-0.5 cursor-pointer ${
                        item.isCompleted
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-stone-300 text-transparent"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 fill-current" />
                    </button>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C05638] font-mono">
                        {item.timeSlot}
                      </span>
                      <h4 className={`font-serif font-bold text-sm ${item.isCompleted ? "line-through text-stone-400" : "text-stone-900"}`}>
                        {item.activityTitle}
                      </h4>
                      <p className="text-xs text-stone-500">Lieu : {item.location || "Sur site"}</p>
                      {item.personInCharge && (
                        <p className="text-[11px] text-stone-400">
                          Responsable : {item.personInCharge} {item.contactPhone ? `(${item.contactPhone})` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Blessings Feed & Add Button */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Mur de Bénédictions en Direct
              </h3>
              <button
                onClick={() => setIsBlessingModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#C05638] text-white font-bold text-xs shadow-xs cursor-pointer hover:bg-[#A84429]"
                style={{ backgroundColor: activeTheme.primary }}
              >
                Ajouter une bénédiction
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {blessings.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#EAE2D5] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-stone-900 font-bold">{b.senderName}</strong>
                    <span className="text-[10px] text-stone-400">{b.senderRelation}</span>
                  </div>
                  <p className="text-stone-700 italic font-serif leading-relaxed">
                    « {b.blessingText} »
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Fullscreen Big Screen Live Wall Modal (LUMINEUX, WHITE / ICE GLASS & OR) */}
      {isLiveWallOpen && (
        <div className="fixed inset-0 z-50 bg-[#FDFBF7] flex flex-col items-center justify-between p-8 text-stone-900 animate-in fade-in">
          
          <div className="w-full max-w-6xl flex items-center justify-between border-b border-[#EAE2D5] pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#C05638] animate-ping"></span>
              <span className="font-serif font-bold text-xl sm:text-2xl text-[#C05638]">
                {couple?.partner1Name} & {couple?.partner2Name} : Mur des Bénédictions
              </span>
            </div>
            <button
              onClick={() => setIsLiveWallOpen(false)}
              className="p-2.5 px-4 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold shadow-2xs cursor-pointer"
            >
              Quitter le Mode Plein Écran
            </button>
          </div>

          {/* Active Blessing Display */}
          <div className="max-w-4xl text-center space-y-6 my-auto p-8 rounded-3xl glass-panel border border-[#D4AF37]/50 shadow-xl animate-in zoom-in-95 duration-500">
            {blessings[activeSlide] ? (
              <>
                <Heart className="w-16 h-16 text-[#C05638] mx-auto animate-pulse" />
                <p className="font-serif text-3xl sm:text-5xl italic leading-relaxed text-stone-900">
                  « {blessings[activeSlide].blessingText} »
                </p>
                <div className="text-lg sm:text-2xl font-bold text-[#B37D28]">
                  {blessings[activeSlide].senderName} ({blessings[activeSlide].senderRelation})
                </div>
              </>
            ) : (
              <p className="text-stone-500 text-lg">En attente des premières bénédictions...</p>
            )}
          </div>

          <div className="text-xs text-stone-500 font-serif">
            Wedding Mood Côte d'Ivoire
          </div>
        </div>
      )}

      {/* Add Blessing Modal */}
      {isBlessingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">Publier une Bénédiction</h3>
              <button onClick={() => setIsBlessingModalOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBlessing} className="space-y-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Nom ou Famille *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pasteur Jean & Famille"
                  value={blessingForm.senderName}
                  onChange={(e) => setBlessingForm({ ...blessingForm, senderName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Lien ou Relation</label>
                <input
                  type="text"
                  placeholder="Ex: Famille, Chorale, Collègues..."
                  value={blessingForm.senderRelation}
                  onChange={(e) => setBlessingForm({ ...blessingForm, senderRelation: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Votre Bénédiction *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Que l'Éternel bénisse abondamment votre union..."
                  value={blessingForm.blessingText}
                  onChange={(e) => setBlessingForm({ ...blessingForm, blessingText: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBlessingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C05638] text-white font-bold cursor-pointer hover:bg-[#A84429]"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Publier sur le mur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

