"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  CreditCard,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  Users,
  User,
  Copy,
  Check,
  KeyRound,
  Mail,
  RefreshCw,
  Save,
  Sparkles,
  Smartphone,
} from "lucide-react";
import {
  WAVE_PAY_COUPLE_URL,
  WAVE_PAY_INDIVIDUAL_URL,
  OFFICIAL_WHATSAPP_URL,
  OFFICIAL_WHATSAPP_NUMBER,
  PRICING_PLANS,
} from "@/lib/constants";

export default function SubscriptionPage() {
  const { couple, activeTheme, refreshCoupleData } = useTheme();
  const [payInfo, setPayInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Formule sélectionnée : couple (3 000 FCFA) ou individual (2 000 FCFA)
  const [selectedPlan, setSelectedPlan] = useState<"couple" | "individual">("couple");

  const [form, setForm] = useState({
    amount: "3000",
    paymentDate: new Date().toISOString().split("T")[0],
    referenceNumber: "",
    payerEmail: "",
    proofImageUrl: "",
  });

  // Emails des deux partenaires
  const [emailsForm, setEmailsForm] = useState({
    newPartner1Email: "",
    newPartner2Email: "",
  });
  const [emailsSaved, setEmailsSaved] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payments");
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setPayInfo(d);
          setSelectedPlan(d.planType === "individual" ? "individual" : "couple");
          setForm((prev) => ({
            ...prev,
            amount: d.planType === "individual" ? "2000" : "3000",
            payerEmail: d.partner1Email || "",
          }));
          setEmailsForm({
            newPartner1Email: d.partner1Email || "",
            newPartner2Email: d.partner2Email || "",
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSelectPlan = (planId: "couple" | "individual") => {
    setSelectedPlan(planId);
    setForm((prev) => ({
      ...prev,
      amount: planId === "individual" ? "2000" : "3000",
    }));
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.referenceNumber || !form.paymentDate) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          planType: selectedPlan,
          partner2Email: emailsForm.newPartner2Email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        fetchPayments();
        refreshCoupleData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEmails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-partner-emails",
          ...emailsForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailsSaved(true);
        setTimeout(() => setEmailsSaved(false), 2500);
        fetchPayments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenerateCode = async () => {
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate-code" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPayments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = () => {
    if (payInfo?.accessCode) {
      navigator.clipboard.writeText(payInfo.accessCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShareAccessWhatsApp = () => {
    const msg = `Bonjour ! Voici notre accès partagé Wedding Mood :\n\nEspace : ${payInfo?.partner1Name} & ${payInfo?.partner2Name}\nCode d'accès unique : ${payInfo?.accessCode}\n\nConnecte-toi avec ton adresse email et ce code pour rejoindre notre espace de préparation.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const status = couple?.status || "trial";

  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">Compte Actif (Accès Illimité)</span>;
      case "verification":
        return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">Paiement en Vérification</span>;
      case "pending_payment":
        return <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-bold text-xs">En Attente de Paiement</span>;
      case "suspended":
        return <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold text-xs">Compte Suspendu</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">Période d'Essai (3 Jours)</span>;
    }
  };

  const activePayUrl = selectedPlan === "couple" ? WAVE_PAY_COUPLE_URL : WAVE_PAY_INDIVIDUAL_URL;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Abonnement Wave Manuel & Accès Partagé</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Formules d'Accès Wedding Mood
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Choisissez la formule adaptée à votre couple. Le règlement s'effectue manuellement via Wave Côte d'Ivoire, puis notre équipe valide votre accès sous 2h à 24h.
        </p>
      </div>

      {/* Statut du Compte & Code d'Accès Unique */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Carte Statut */}
        <div className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-3">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Statut Actuel de Votre Espace</span>
          <div>{getStatusBadge()}</div>
          <p className="text-xs text-stone-600">
            Couple : <strong>{payInfo?.partner1Name || couple?.partner1Name}</strong> & <strong>{payInfo?.partner2Name || couple?.partner2Name}</strong>
          </p>
          <p className="text-xs text-stone-500">
            Formule actuelle :{" "}
            <strong className="text-[#C05638]">
              {payInfo?.planType === "individual" ? "Individuelle (2 000 FCFA)" : "Couple (3 000 FCFA)"}
            </strong>
          </p>

          <a
            href={OFFICIAL_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer mt-1"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Assistance WhatsApp ({OFFICIAL_WHATSAPP_NUMBER})</span>
          </a>
        </div>

        {/* Carte Code d'Accès Unique */}
        <div className="p-6 rounded-3xl glass-card-warm border border-[#D4AF37]/50 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#B37D28]" />
            <span className="text-[11px] font-bold text-stone-600 uppercase">
              Code d'Accès Unique du Couple
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white border-2 border-[#D4AF37]/60 shadow-2xs">
            <span className="font-serif font-black text-3xl tracking-widest text-[#C05638]">
              {payInfo?.accessCode || "WM-0000"}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer transition-colors"
                title="Copier le code d'accès"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleRegenerateCode}
                className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer transition-colors"
                title="Générer un nouveau code"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-stone-600 leading-relaxed">
            Ce code unique permet aux <strong>deux partenaires</strong> de se connecter depuis leurs propres téléphones en saisissant simplement leur adresse email personnelle et ce code.
          </p>

          <button
            onClick={handleShareAccessWhatsApp}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Transmettre l'accès à mon conjoint via WhatsApp</span>
          </button>
        </div>
      </div>

      {/* SÉLECTION DES DEUX FORMULES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {PRICING_PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`p-6 sm:p-8 rounded-3xl border-2 transition-all space-y-5 flex flex-col justify-between ${
                isSelected
                  ? "glass-card-warm border-[#C05638] ring-2 ring-[#C05638]/30 shadow-lg"
                  : "glass-panel border-stone-200 hover:border-stone-300"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {plan.id === "couple" ? (
                        <Users className="w-5 h-5 text-[#C05638]" />
                      ) : (
                        <User className="w-5 h-5 text-stone-600" />
                      )}
                      <h3 className="font-serif font-bold text-stone-900 text-xl">{plan.name}</h3>
                    </div>
                    <span className="text-[11px] text-stone-500">{plan.tagline}</span>
                  </div>

                  {plan.isRecommended && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#C05638] text-white shadow-xs">
                      Recommandée
                    </span>
                  )}
                </div>

                <div className="font-serif font-black text-4xl text-stone-900">
                  {plan.amount.toLocaleString("fr-FR")}{" "}
                  <span className="text-base font-normal text-stone-500">FCFA</span>
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

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => handleSelectPlan(plan.id as "couple" | "individual")}
                  className={`w-full py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#C05638] text-white shadow-md"
                      : "bg-white border border-stone-200 text-stone-800 hover:bg-stone-50"
                  }`}
                  style={isSelected ? { backgroundColor: activeTheme.primary } : {}}
                >
                  {isSelected ? "Formule sélectionnée" : "Choisir cette formule"}
                </button>

                <a
                  href={plan.payUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Payer {plan.amount.toLocaleString("fr-FR")} FCFA sur Wave</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* GESTION DES EMAILS DES DEUX PARTENAIRES */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <Mail className="w-5 h-5 text-[#C05638]" />
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              Adresses Email des Deux Partenaires
            </h3>
            <p className="text-xs text-stone-500">
              Chaque partenaire se connecte avec son adresse email personnelle et le code d'accès unique du couple.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveEmails} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Email de {payInfo?.partner1Name || "Époux"} (Partenaire 1) *
              </label>
              <input
                type="email"
                required
                value={emailsForm.newPartner1Email}
                onChange={(e) => setEmailsForm({ ...emailsForm, newPartner1Email: e.target.value })}
                placeholder="Époux@exemple.ci"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Email de {payInfo?.partner2Name || "Épouse"} (Partenaire 2)
              </label>
              <input
                type="email"
                value={emailsForm.newPartner2Email}
                onChange={(e) => setEmailsForm({ ...emailsForm, newPartner2Email: e.target.value })}
                placeholder="Épouse@exemple.ci"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-100">
            {emailsSaved ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Adresses enregistrées avec succès !
              </span>
            ) : (
              <span className="text-[11px] text-stone-500">
                Les deux partenaires accèdent au même espace partagé et synchronisé.
              </span>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-[#C05638] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les emails</span>
            </button>
          </div>
        </form>
      </div>

      {/* SOUMISSION DE LA PREUVE DE PAIEMENT WAVE */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-[#C05638]" />
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              Confirmer Mon Règlement Wave
            </h3>
            <p className="text-xs text-stone-500">
              Après avoir effectué le paiement sur Wave, renseignez la référence de transaction pour activer votre accès.
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl glass-card-warm border border-[#EAE2D5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-stone-500 font-medium block">Formule sélectionnée :</span>
            <strong className="font-serif font-bold text-stone-900 text-base">
              {selectedPlan === "couple" ? "Formule Couple" : "Formule Individuelle"} • {selectedPlan === "couple" ? "3 000" : "2 000"} FCFA
            </strong>
          </div>

          <a
            href={activePayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Ouvrir le lien Wave</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <form onSubmit={handleSubmitProof} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Montant Payé (FCFA) *</label>
              <input
                type="number"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Date du Paiement *</label>
              <input
                type="date"
                required
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Email du Payeur *</label>
              <input
                type="email"
                required
                value={form.payerEmail}
                onChange={(e) => setForm({ ...form, payerEmail: e.target.value })}
                placeholder="votre@email.ci"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">
              Référence de Transaction Wave (SMS de confirmation) *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: TXN-CI-20251115-XXXXXX"
              value={form.referenceNumber}
              onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">
              Lien de la Capture d'Écran (Optionnel)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={form.proofImageUrl}
              onChange={(e) => setForm({ ...form, proofImageUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-[#C05638] text-white font-bold text-xs shadow-md hover:bg-[#A84429] transition-all disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: activeTheme.primary }}
          >
            {submitting ? "Soumission en cours..." : "Soumettre ma preuve de paiement pour vérification"}
          </button>
        </form>
      </div>

      {/* Historique des Règlements */}
      {payInfo?.payments?.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-100 pb-3">
            Historique des Règlements Soumis
          </h3>

          <div className="space-y-3 text-xs">
            {payInfo.payments.map((p: any) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl glass-card-warm border border-[#EAE2D5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-stone-900 font-bold text-sm">
                      {p.amount?.toLocaleString("fr-FR")} FCFA
                    </strong>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-bold uppercase">
                      {p.planType === "individual" ? "Individuelle" : "Couple"}
                    </span>
                  </div>
                  <div className="text-stone-500 font-mono text-[11px] mt-0.5">
                    Réf : {p.referenceNumber} • {p.paymentDate}
                  </div>
                  {p.payerEmail && (
                    <div className="text-stone-400 text-[10px]">Payeur : {p.payerEmail}</div>
                  )}
                  {p.adminNotes && (
                    <div className="text-stone-600 text-[11px] mt-1 italic">
                      Note administrative : {p.adminNotes}
                    </div>
                  )}
                </div>

                <span
                  className={`px-3 py-1 rounded-full font-bold text-[10px] shrink-0 ${
                    p.status === "verified"
                      ? "bg-emerald-100 text-emerald-800"
                      : p.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {p.status === "verified"
                    ? "Paiement Validé"
                    : p.status === "rejected"
                    ? "Paiement Rejeté"
                    : "En Vérification"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

