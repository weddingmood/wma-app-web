"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  ScrollText,
  CheckCircle2,
  RotateCcw,
  Edit2,
  X,
} from "lucide-react";

export default function CommandmentsPage() {
  const { couple, activePartner, partnerName, activeTheme } = useTheme();
  const [commandments, setCommandments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 10, bothConfirmedCount: 0, progressPercent: 0 });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCmd, setSelectedCmd] = useState<any>(null);

  const fetchCommandments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/commandments");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCommandments(data.commandments || []);
          setStats(data.stats || { total: 10, bothConfirmedCount: 0, progressPercent: 0 });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandments();
  }, []);

  const handleToggleConfirm = async (id: number) => {
    try {
      await fetch("/api/commandments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggle-confirmation" }),
      });
      fetchCommandments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDefault = async () => {
    if (!confirm("Voulez-vous réinitialiser les 10 commandements par défaut ?")) return;
    try {
      await fetch("/api/commandments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-default" }),
      });
      fetchCommandments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCmd) return;
    try {
      await fetch("/api/commandments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCmd.id,
          text: selectedCmd.text,
          importanceWhy: selectedCmd.importanceWhy,
          commitmentText: selectedCmd.commitmentText,
        }),
      });
      setIsEditModalOpen(false);
      fetchCommandments();
    } catch (err) {
      console.error(err);
    }
  };

  const isP1 = activePartner === "partner1";

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100 mb-2">
            <ScrollText className="w-3.5 h-3.5" />
            <span>Charte d'Alliance du Couple</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Les 10 Commandements de Notre Foyer
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">
            Les engagements réciproques sacrés scellés devant Dieu pour protéger l'harmonie et l'amour de notre maison.
          </p>
        </div>

        <button
          onClick={handleResetDefault}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurer Défaut</span>
        </button>
      </div>

      {/* Progress Box */}
      <div className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-stone-500 uppercase">Progression des Engagements Scellés</span>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
            {stats.bothConfirmedCount} sur {commandments.length} commandements scellés à deux ({stats.progressPercent} %)
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Chaque partenaire confirme individuellement son accord pour chaque commandement.
          </p>
        </div>

        <div className="w-full sm:w-48 bg-stone-100 h-3 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-[#C05638] rounded-full transition-all duration-700"
            style={{ width: `${stats.progressPercent}%`, backgroundColor: activeTheme.primary }}
          ></div>
        </div>
      </div>

      {/* Commandments List */}
      <div className="space-y-4">
        {commandments.map((cmd) => {
          const isBoth = cmd.partner1Confirmed && cmd.partner2Confirmed;
          const myConfirmed = isP1 ? cmd.partner1Confirmed : cmd.partner2Confirmed;

          return (
            <div
              key={cmd.id}
              className={`p-6 rounded-3xl border transition-all space-y-4 ${
                isBoth
                  ? "glass-card-warm border-[#EAE2D5] shadow-2xs"
                  : "glass-panel border-stone-200 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-3">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#C05638] text-white font-serif font-bold text-sm shrink-0" style={{ backgroundColor: activeTheme.primary }}>
                    {cmd.orderIndex}
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-lg leading-tight">
                      {cmd.text}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedCmd(cmd);
                    setIsEditModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 shrink-0 cursor-pointer"
                  title="Modifier ce commandement"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {cmd.importanceWhy && (
                  <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-100 space-y-1">
                    <strong className="block text-stone-800 font-bold">
                      Pourquoi il est important pour nous :
                    </strong>
                    <p className="text-stone-600 leading-relaxed">{cmd.importanceWhy}</p>
                  </div>
                )}

                {cmd.commitmentText && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                    <strong className="block text-amber-900 font-bold">
                      Notre engagement réciproque :
                    </strong>
                    <p className="text-stone-700 leading-relaxed">{cmd.commitmentText}</p>
                  </div>
                )}
              </div>

              {/* Partners Confirmation Status & Button */}
              <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-stone-600">
                  <span className="flex items-center gap-1.5">
                    {cmd.partner1Confirmed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-stone-300"></span>
                    )}
                    <span>{couple?.partner1Name || "Époux"} : <strong>{cmd.partner1Confirmed ? "Confirmé" : "En attente"}</strong></span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    {cmd.partner2Confirmed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-stone-300"></span>
                    )}
                    <span>{couple?.partner2Name || "Épouse"} : <strong>{cmd.partner2Confirmed ? "Confirmé" : "En attente"}</strong></span>
                  </span>
                </div>

                <button
                  onClick={() => handleToggleConfirm(cmd.id)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    myConfirmed
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-[#C05638] text-white hover:bg-[#A84429] shadow-xs"
                  }`}
                  style={!myConfirmed ? { backgroundColor: activeTheme.primary } : {}}
                >
                  {myConfirmed ? "Mon engagement est scellé" : `Confirmer cet engagement (${partnerName.split(" ")[0]})`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Commandment Modal */}
      {isEditModalOpen && selectedCmd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Modifier le Commandement N°{selectedCmd.orderIndex}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Texte du Commandement *</label>
                <input
                  type="text"
                  required
                  value={selectedCmd.text}
                  onChange={(e) => setSelectedCmd({ ...selectedCmd, text: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Pourquoi il est important pour nous</label>
                <textarea
                  rows={3}
                  value={selectedCmd.importanceWhy || ""}
                  onChange={(e) => setSelectedCmd({ ...selectedCmd, importanceWhy: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Notre Engagement Réciproque</label>
                <textarea
                  rows={3}
                  value={selectedCmd.commitmentText || ""}
                  onChange={(e) => setSelectedCmd({ ...selectedCmd, commitmentText: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 cursor-pointer"
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

