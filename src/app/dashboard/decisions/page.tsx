"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import { Scale, Plus, CheckCircle2, XCircle, MessageSquare, Clock, X } from "lucide-react";

export default function DecisionsPage() {
  const { couple, activePartner, partnerName, activeTheme } = useTheme();
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    proposalDetails: "",
    initialComment: "",
  });

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/decisions");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDecisions(data.decisions || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({
          title: "",
          description: "",
          amount: "",
          proposalDetails: "",
          initialComment: "",
        });
        fetchDecisions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (id: number, partnerDecision: "approved" | "rejected", comment: string) => {
    try {
      await fetch("/api/decisions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, partnerDecision, comment }),
      });
      fetchDecisions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100 mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Unité & Concertation du Couple</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Décisions Majeures du Foyer
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">
            Prenez les grandes décisions d'un commun accord avec historique des avis et validation mutuelle.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white text-xs font-bold shadow-md transition-all shrink-0"
          style={{ backgroundColor: activeTheme.primary }}
        >
          <Plus className="w-4 h-4" />
          <span>Proposer une Décision</span>
        </button>
      </div>

      {/* Decisions Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-stone-500 text-xs">Chargement des décisions...</div>
        ) : decisions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
            <Scale className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="font-serif font-bold text-stone-800 text-base">Aucune décision en cours</h3>
            <p className="text-xs text-stone-500">Ouvrez une proposition pour recueillir l'accord de votre fiancé(e).</p>
          </div>
        ) : (
          decisions.map((d) => {
            const isApproved = d.status === "approved";
            const isRejected = d.status === "rejected";
            const isP1 = activePartner === "partner1";
            const myVote = isP1 ? d.partner1Decision : d.partner2Decision;
            const otherVote = isP1 ? d.partner2Decision : d.partner1Decision;
            const otherName = isP1 ? couple?.partner2Name || "Ruth" : couple?.partner1Name || "David";

            return (
              <div
                key={d.id}
                className={`p-6 rounded-3xl border transition-all space-y-4 ${
                  isApproved
                    ? "bg-[#FCFAF7] border-emerald-200"
                    : isRejected
                    ? "bg-red-50/50 border-red-200"
                    : "bg-white border-stone-200 hover:shadow-md"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-lg">{d.title}</h3>
                    {d.amount > 0 && (
                      <span className="text-xs text-amber-800 font-bold">
                        Impact financier : {d.amount.toLocaleString("fr-FR")} FCFA
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isApproved
                        ? "bg-emerald-100 text-emerald-800"
                        : isRejected
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isApproved ? "Accord Conjoint Trouvé ✓" : isRejected ? "Décision Écartée ✗" : "En Concertation"}
                  </span>
                </div>

                {d.description && (
                  <p className="text-xs text-stone-700 leading-relaxed">{d.description}</p>
                )}

                {d.proposalDetails && (
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800">
                    <strong className="block text-stone-900 mb-1">Détails de la proposition :</strong>
                    {d.proposalDetails}
                  </div>
                )}

                {/* Partners Comments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-800">{couple?.partner1Name || "David (Lui)"}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        d.partner1Decision === "approved" ? "bg-emerald-100 text-emerald-700" : d.partner1Decision === "rejected" ? "bg-red-100 text-red-700" : "bg-stone-100 text-stone-500"
                      }`}>
                        {d.partner1Decision === "approved" ? "Approuvé" : d.partner1Decision === "rejected" ? "Refusé" : "En attente"}
                      </span>
                    </div>
                    <p className="text-stone-600 text-[11px] italic">{d.partner1Comment || "Pas de commentaire"}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-800">{couple?.partner2Name || "Ruth (Elle)"}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        d.partner2Decision === "approved" ? "bg-emerald-100 text-emerald-700" : d.partner2Decision === "rejected" ? "bg-red-100 text-red-700" : "bg-stone-100 text-stone-500"
                      }`}>
                        {d.partner2Decision === "approved" ? "Approuvé" : d.partner2Decision === "rejected" ? "Refusé" : "En attente"}
                      </span>
                    </div>
                    <p className="text-stone-600 text-[11px] italic">{d.partner2Comment || "Pas de commentaire"}</p>
                  </div>
                </div>

                {/* Action Buttons for Current Partner if not decided */}
                {!isApproved && !isRejected && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => handleVote(d.id, "rejected", "Je préfère que nous réévaluions cette option.")}
                      className="px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold"
                    >
                      Refuser l'option
                    </button>
                    <button
                      onClick={() => handleVote(d.id, "approved", "D'accord pour avancer avec cette option !")}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                    >
                      Donner mon accord
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">Soumettre une Décision de Couple</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Titre de la décision *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Choix du couturier pour les tenues kita"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Impact Financier Estimé (FCFA)</label>
                <input
                  type="number"
                  placeholder="Ex: 350000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Options & Détails</label>
                <textarea
                  rows={2}
                  placeholder="Explication des options et arguments..."
                  value={form.proposalDetails}
                  onChange={(e) => setForm({ ...form, proposalDetails: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Mon Avis / Mon Commentaire</label>
                <input
                  type="text"
                  placeholder="Ex: Je vote oui car leur catalogue est remarquable."
                  value={form.initialComment}
                  onChange={(e) => setForm({ ...form, initialComment: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C05638] text-white font-bold"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Ouvrir la décision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
