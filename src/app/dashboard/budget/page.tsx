"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  Wallet,
  Plus,
  ShieldCheck,
  CheckCircle2,
  X,
} from "lucide-react";

export default function BudgetPage() {
  const { couple, activePartner, partnerName, activeTheme } = useTheme();
  const [budgetData, setBudgetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    categoryId: "",
    title: "",
    amount: "",
    advancePaid: "",
    dueDate: "",
    recipient: "",
    notes: "",
  });

  const [catForm, setCatForm] = useState({
    name: "",
    allocatedAmount: "",
  });

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/budget");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBudgetData(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) return;

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseForm),
      });
      if (res.ok) {
        setIsExpenseModalOpen(false);
        setExpenseForm({
          categoryId: "",
          title: "",
          amount: "",
          advancePaid: "",
          dueDate: "",
          recipient: "",
          notes: "",
        });
        fetchBudget();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) return;

    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catForm),
      });
      if (res.ok) {
        setIsCategoryModalOpen(false);
        setCatForm({ name: "", allocatedAmount: "" });
        fetchBudget();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExpenseAction = async (id: number, action: "approve" | "reject") => {
    try {
      await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      fetchBudget();
    } catch (err) {
      console.error(err);
    }
  };

  const summary = budgetData?.summary || {
    totalBudget: 6500000,
    totalSpent: 0,
    totalCommitted: 0,
    remainingBudget: 6500000,
    percentUsed: 0,
    pendingValidationsCount: 0,
  };

  const categories = budgetData?.categories || [];
  const expensesList = budgetData?.expenses || [];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100 mb-2">
            <Wallet className="w-3.5 h-3.5" />
            <span>Gestion Financière en FCFA</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Budget & Dépenses du Couple
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">
            Règle de sagesse : toute dépense supérieure à <strong>50 000 FCFA</strong> requiert la double validation conjointe (Elle & Lui).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            + Catégorie
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            style={{ backgroundColor: activeTheme.primary }}
          >
            <Plus className="w-4 h-4" />
            <span>Engager une Dépense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl glass-panel border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Budget Prévisionnel Total</span>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
            {summary.totalBudget.toLocaleString("fr-FR")} FCFA
          </div>
          <span className="text-xs text-stone-500">Fixé pour les 4 cérémonies</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Engagé & Validé</span>
          <div className="text-2xl font-serif font-bold text-amber-700 mt-1">
            {summary.totalCommitted.toLocaleString("fr-FR")} FCFA
          </div>
          <span className="text-xs text-amber-600 font-medium">
            {summary.percentUsed} % du budget total
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Acomptes Déjà Versés</span>
          <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {summary.totalSpent.toLocaleString("fr-FR")} FCFA
          </div>
          <span className="text-xs text-emerald-600 font-medium">Décaissé en trésorerie</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Reste Disponible</span>
          <div className="text-2xl font-serif font-bold text-blue-700 mt-1">
            {summary.remainingBudget.toLocaleString("fr-FR")} FCFA
          </div>
          <span className="text-xs text-stone-500">Marge de sécurité</span>
        </div>

      </div>

      {/* Dual Validation Alerts Stage */}
      {expensesList.some((e: any) => e.requiresDualValidation && e.validationStatus === "pending") && (
        <div className="p-6 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-800" />
            <div>
              <h3 className="font-serif font-bold text-amber-950 text-base">
                Dépenses Supérieures à 50 000 FCFA en Attente d'Accord Conjoint
              </h3>
              <p className="text-xs text-amber-800">
                La transparence financière sanctifie votre couple. Donnez votre accord pour valider ces paiements.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {expensesList
              .filter((e: any) => e.requiresDualValidation && e.validationStatus === "pending")
              .map((e: any) => (
                <div
                  key={e.id}
                  className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-serif font-bold text-stone-900 text-sm">{e.title}</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Montant : <strong className="text-amber-800 font-bold">{e.amount.toLocaleString("fr-FR")} FCFA</strong> • Prestataire : {e.recipient || "Non spécifié"}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">
                      Accord Époux (Lui) : {e.partner1Approved ? "Validé" : "En attente"} | Accord Épouse (Elle) : {e.partner2Approved ? "Validé" : "En attente"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleExpenseAction(e.id, "reject")}
                      className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold cursor-pointer"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={() => handleExpenseAction(e.id, "approve")}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Valider la dépense
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Categories & Expenses List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Categories Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-100 pb-3">
              Répartition par Poste Budgétaire
            </h3>

            <div className="space-y-3">
              {categories.map((c: any) => {
                const catExpenses = expensesList.filter((e: any) => e.categoryId === c.id);
                const spent = catExpenses.reduce((sum: number, e: any) => sum + (e.advancePaid || 0), 0);
                const committed = catExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
                const pct = c.allocatedAmount > 0 ? Math.min(100, Math.round((committed / c.allocatedAmount) * 100)) : 0;

                return (
                  <div key={c.id} className="p-3.5 rounded-2xl glass-card-warm border border-[#EAE2D5] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-stone-900 font-bold">{c.name}</strong>
                      <span className="text-stone-600 font-semibold">{c.allocatedAmount?.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#C05638] h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: activeTheme.primary }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>Engagé : {committed.toLocaleString("fr-FR")} FCFA</span>
                      <span>{pct} %</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Expenses Full Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-100 pb-3">
              Dépenses & Échéances Enregistrées
            </h3>

            <div className="space-y-2.5">
              {expensesList.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-8">Aucune dépense enregistrée.</p>
              ) : (
                expensesList.map((e: any) => {
                  const isApproved = e.validationStatus === "approved_by_both";
                  return (
                    <div
                      key={e.id}
                      className="p-4 rounded-2xl bg-white/70 border border-stone-200 hover:bg-white transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-serif font-bold text-stone-900 text-sm">{e.title}</div>
                        <div className="text-xs text-stone-500">
                          Acompte versé : <strong>{e.advancePaid?.toLocaleString("fr-FR")} FCFA</strong> • Reste dû : <strong>{e.remainingAmount?.toLocaleString("fr-FR")} FCFA</strong>
                        </div>
                        {e.dueDate && (
                          <div className="text-[11px] text-stone-400">Échéance : {e.dueDate}</div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-serif font-bold text-stone-900 text-base">
                          {e.amount.toLocaleString("fr-FR")} FCFA
                        </div>
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isApproved ? "Accord Conjoint Scellé" : "En Validation"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* New Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Engager une Nouvelle Dépense
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Libellé de la dépense *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Acompte Traiteur Repas Noces"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Montant Total (FCFA) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 500000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Acompte Payé (FCFA)</label>
                  <input
                    type="number"
                    placeholder="Ex: 200000"
                    value={expenseForm.advancePaid}
                    onChange={(e) => setExpenseForm({ ...expenseForm, advancePaid: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Catégorie</label>
                  <select
                    value={expenseForm.categoryId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Date d'échéance</label>
                  <input
                    type="date"
                    value={expenseForm.dueDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Prestataire / Bénéficiaire</label>
                <input
                  type="text"
                  placeholder="Ex: Espace Riviera Golf / Bijouterie Royale"
                  value={expenseForm.recipient}
                  onChange={(e) => setExpenseForm({ ...expenseForm, recipient: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                Toute dépense supérieure à 50 000 FCFA est soumise à la validation conjointe de votre conjoint.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C05638] text-white font-bold cursor-pointer hover:bg-[#A84429]"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Enregistrer la dépense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">Ajouter un Poste Budgétaire</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Nom du poste *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sonorisation & Chantres"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>
              <div>
                <label className="block text-stone-700 font-bold mb-1">Montant alloué (FCFA)</label>
                <input
                  type="number"
                  placeholder="Ex: 300000"
                  value={catForm.allocatedAmount}
                  onChange={(e) => setCatForm({ ...catForm, allocatedAmount: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C05638] text-white font-bold cursor-pointer hover:bg-[#A84429]"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

