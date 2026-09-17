"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import { Wallet, Heart, Plus, Sparkles, CheckCircle2, User, X } from "lucide-react";

export default function CagnottePage() {
  const { couple, activeTheme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    donorName: "",
    donorPhone: "",
    amount: "",
    message: "",
    paymentReference: "",
  });

  const fetchCagnotte = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cagnotte");
      if (res.ok) {
        const d = await res.json();
        if (d.success) setData(d);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCagnotte();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.donorName || !form.amount) return;
    try {
      const res = await fetch("/api/cagnotte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ donorName: "", donorPhone: "", amount: "", message: "", paymentReference: "" });
        fetchCagnotte();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const targetGoal = data?.targetGoal || 2500000;
  const totalCollected = data?.totalCollected || 0;
  const progressPercent = data?.progressPercent || 0;
  const contributions = data?.contributions || [];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100">
          <Wallet className="w-3.5 h-3.5" />
          <span>Solidarité & Installation du Foyer</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Cagnotte Foyer & Premier Loyer
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Pour les invités et proches souhaitant bénir le nouveau foyer plutôt que d'offrir des cadeaux physiques volumineux. Les dons sont enregistrés en toute transparence.
        </p>
      </div>

      {/* Progress & KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Montant Collecté</span>
          <div className="text-3xl font-serif font-extrabold text-emerald-700">
            {totalCollected.toLocaleString("fr-FR")} FCFA
          </div>
          <span className="text-xs text-stone-500">sur {targetGoal.toLocaleString("fr-FR")} FCFA visés</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Progression Globale</span>
          <div className="text-3xl font-serif font-extrabold text-[#C05638]">
            {progressPercent} %
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-[#C05638] rounded-full"
              style={{ width: `${progressPercent}%`, backgroundColor: activeTheme.primary }}
            ></div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase">Bienfaiteurs & Familles</span>
            <div className="text-3xl font-serif font-extrabold text-stone-900">
              {contributions.length} participations
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors"
          >
            + Enregistrer un Don
          </button>
        </div>

      </div>

      {/* Contributions Feed */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-100 pb-3">
          Messages & Bénédictions des Donateurs
        </h3>

        <div className="space-y-3">
          {contributions.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">Aucune participation enregistrée pour le moment.</p>
          ) : (
            contributions.map((c: any) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#EAE2D5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-stone-900 font-bold text-sm">{c.donorName}</strong>
                    {c.donorPhone && <span className="text-stone-400">({c.donorPhone})</span>}
                  </div>
                  {c.message && <p className="text-stone-700 italic">« {c.message} »</p>}
                  {c.paymentReference && (
                    <span className="text-[10px] text-stone-400">Réf : {c.paymentReference}</span>
                  )}
                </div>

                <div className="text-right shrink-0 font-serif font-bold text-base text-emerald-800">
                  +{c.amount?.toLocaleString("fr-FR")} FCFA
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">Enregistrer une Contribution</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nom du bienfaiteur / Famille *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tante Kouassi & Oncle Jean"
                  value={form.donorName}
                  onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Montant (FCFA) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 50000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    placeholder="+225..."
                    value={form.donorPhone}
                    onChange={(e) => setForm({ ...form, donorPhone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Message de bénédiction</label>
                <textarea
                  rows={2}
                  placeholder="Que le Seigneur bénisse votre maison..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C05638] text-white font-bold"
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
