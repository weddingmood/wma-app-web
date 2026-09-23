"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  CreditCard,
  Store,
  CheckCircle2,
  Search,
  BarChart3,
  RefreshCw,
  Trash2,
  LogOut,
  Gamepad2,
  KeyRound,
  CalendarPlus,
  Crown,
  Ban,
  Download,
  History,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";

type AdminTab = "stats" | "couples" | "payments" | "providers" | "games" | "audit" | "settings";

export default function AdminPage() {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");

  // Login form
  const [adminEmail, setAdminEmail] = useState("admin@weddingmood.ci");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Data
  const [stats, setStats] = useState<any>(null);
  const [couplesList, setCouplesList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [providersList, setProvidersList] = useState<any[]>([]);
  const [gamesAdminData, setGamesAdminData] = useState<any>(null);
  const [auditList, setAuditList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [searchCouple, setSearchCouple] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");

  // Settings form
  const [settingsName, setSettingsName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [settingsMsg, setSettingsMsg] = useState("");

  const checkAdminAuth = async () => {
    try {
      const res = await fetch("/api/admin/auth");
      if (res.ok) {
        const d = await res.json();
        if (d.authenticated) {
          setIsAdminAuth(true);
          setAdminUser(d.admin);
          setSettingsName(d.admin?.name || "");
          loadAdminData();
        }
      }
    } catch {
      // not auth
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const d = await res.json();
      if (d.success) {
        setIsAdminAuth(true);
        setAdminUser(d.admin);
        setSettingsName(d.admin?.name || "");
        loadAdminData();
      } else {
        setLoginError(d.message || "Identifiants incorrects");
      }
    } catch {
      setLoginError("Erreur de connexion");
    }
  };

  const handleAdminLogout = async () => {
    await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setIsAdminAuth(false);
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, couplesRes, paymentsRes, providersRes, gamesRes, auditRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/couples"),
        fetch("/api/admin/payments"),
        fetch("/api/admin/providers"),
        fetch("/api/admin/games"),
        fetch("/api/admin/audit"),
      ]);
      if (providersRes.ok) {
        const pr = await providersRes.json();
        if (pr.success) setProvidersList(pr.providers || []);
      }

      if (statsRes.ok) {
        const s = await statsRes.json();
        if (s.success) setStats(s.stats);
      }
      if (couplesRes.ok) {
        const c = await couplesRes.json();
        if (c.success) setCouplesList(c.couples || []);
      }
      if (paymentsRes.ok) {
        const p = await paymentsRes.json();
        if (p.success) setPaymentsList(p.payments || []);
      }
      if (gamesRes.ok) {
        const g = await gamesRes.json();
        if (g.success) setGamesAdminData(g);
      }
      if (auditRes.ok) {
        const a = await auditRes.json();
        if (a.success) setAuditList(a.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const flashMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 3500);
  };

  const handleCouplePatch = async (id: number, payload: Record<string, unknown>, label: string) => {
    try {
      const res = await fetch("/api/admin/couples", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const d = await res.json();
      if (d.success) {
        flashMsg(label);
        loadAdminData();
      } else {
        flashMsg(d.message || "Action refusée");
      }
    } catch (err) {
      console.error(err);
      flashMsg("Erreur réseau");
    }
  };

  const handleDeleteCouple = async (id: number) => {
    if (!confirm("Voulez-vous supprimer définitivement ce compte couple ? Cette action est irréversible.")) return;
    try {
      await fetch(`/api/admin/couples?id=${id}`, { method: "DELETE" });
      flashMsg("Compte supprimé");
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };



  const handleProviderAction = async (id: number, action: "approve" | "reject" | "suspend") => {
    try {
      const res = await fetch("/api/admin/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const d = await res.json();
      flashMsg(d.message || "Decision enregistree");
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };  const handlePaymentAction = async (id: number, action: "accept" | "reject" | "request_new_proof") => {
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const d = await res.json();
      flashMsg(d.message || "Décision enregistrée");
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settingsName,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const d = await res.json();
      setSettingsMsg(d.message || (d.success ? "Enregistré" : "Erreur"));
      if (d.success && d.admin) {
        setAdminUser(d.admin);
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch {
      setSettingsMsg("Erreur réseau");
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ["ID", "Couple", "Email 1", "Email 2", "Code", "Formule", "Montant", "Statut", "Ville", "Mariage", "Créé le"],
      ...filteredCouples.map((c) => [
        c.id,
        `${c.partner1Name} & ${c.partner2Name}`,
        c.partner1Email,
        c.partner2Email || "",
        c.accessCode || "",
        c.planType === "individual" ? "Individuelle" : "Couple",
        c.planAmount || 3000,
        c.status,
        c.city || "",
        c.weddingDate || "",
        c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wedding-mood-couples-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Login Gate
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="glass-panel border border-stone-200 rounded-3xl p-8 max-w-md w-full text-stone-900 space-y-6 shadow-xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#C05638] text-white flex items-center justify-center mx-auto shadow-md">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Administration Wedding Mood</h1>
            <p className="text-xs text-stone-500">
              Console de validation des Packs Premium et de gestion des couples.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Email Administrateur</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C05638]"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Mot de Passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-[#C05638] pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Se Connecter à l'Administration
            </button>
          </form>

          <div className="text-center">
            <a href="/dashboard" className="text-xs text-stone-500 hover:text-stone-800">
              ? Retour à l'application couple
            </a>
          </div>
        </div>
      </div>
    );
  }

  const filteredCouples = couplesList.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterPlan !== "all" && (c.planType || "couple") !== filterPlan) return false;
    if (searchCouple) {
      const q = searchCouple.toLowerCase();
      return (
        c.partner1Name.toLowerCase().includes(q) ||
        c.partner2Name.toLowerCase().includes(q) ||
        c.partner1Email.toLowerCase().includes(q) ||
        (c.partner2Email && c.partner2Email.toLowerCase().includes(q)) ||
        (c.accessCode && c.accessCode.toLowerCase().includes(q)) ||
        c.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingPayments = paymentsList.filter((p) => p.status === "pending");
  const pendingProviders = providersList.filter((p) => p.status === "pending");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-stone-900 pb-16">
      <header className="sticky top-0 z-40 glass-panel border-b border-stone-200 text-stone-900 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#C05638] text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-sm sm:text-base text-stone-900">Wedding Mood • Administration</span>
              <span className="hidden sm:inline-block text-[10px] text-stone-500 ml-2 font-bold uppercase">Côte d'Ivoire</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingPayments.length > 0 && (
              <button
                onClick={() => setActiveTab("payments")}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold hover:bg-amber-200 cursor-pointer"
              >
                {pendingPayments.length} paiement(s) à valider
              </button>
            )}
            <span className="text-xs text-stone-600 hidden sm:inline">
              Connecté : <strong>{adminUser?.name || "Super Admin"}</strong>
            </span>
            <button
              onClick={loadAdminData}
              className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 cursor-pointer"
              title="Actualiser les données"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {actionMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center animate-in fade-in">
            {actionMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3 text-xs">
          {[
            { id: "stats", label: "Tableau de Bord", icon: BarChart3 },
            { id: "couples", label: "Couples & Premium", icon: Users },
            { id: "payments", label: `Paiements Wave (${pendingPayments.length})`, icon: CreditCard },
            { id: "providers", label: `Prestataires (${pendingProviders.length})`, icon: Store },
            { id: "games", label: "Jeux", icon: Gamepad2 },
            { id: "audit", label: "Journal d'audit", icon: History },
            { id: "settings", label: "Paramètres", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-stone-900 text-white shadow-xs"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: STATS */}
        {activeTab === "stats" && stats && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase">Total Couples</span>
                <div className="text-3xl font-serif font-extrabold text-stone-900">{stats.totalCouples}</div>
                <span className="text-xs text-stone-500">{stats.activeCouples} comptes actifs</span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase">En Période d'Essai</span>
                <div className="text-3xl font-serif font-extrabold text-blue-700">{stats.trialCouples}</div>
                <span className="text-xs text-blue-600">3 jours gratuits</span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase">En Vérification</span>
                <div className="text-3xl font-serif font-extrabold text-amber-700">{stats.verificationCouples}</div>
                <span className="text-xs text-amber-600">{stats.pendingPaymentsCount} paiement(s) à traiter</span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase">Recettes Totales</span>
                <div className="text-2xl font-serif font-extrabold text-emerald-700">
                  {stats.totalRevenueFCFA.toLocaleString("fr-FR")} FCFA
                </div>
                <span className="text-xs text-emerald-600">Couple : {stats.revenueCouple?.toLocaleString("fr-FR")} • Indiv. : {stats.revenueIndividual?.toLocaleString("fr-FR")}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase">Pack Couple (3 000)</span>
                <div className="text-2xl font-serif font-bold text-amber-700">{stats.couplePlan}</div>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase">Pack Individuel (2 000)</span>
                <div className="text-2xl font-serif font-bold text-stone-700">{stats.individualPlan}</div>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase">Suspendus / Bloqués</span>
                <div className="text-2xl font-serif font-bold text-red-700">{(stats.suspendedCouples || 0) + (stats.blockedCouples || 0)}</div>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase">Paiements Vérifiés</span>
                <div className="text-2xl font-serif font-bold text-emerald-700">{stats.verifiedPaymentsCount}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COUPLES & PREMIUM */}
        {activeTab === "couples" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher nom, email, code d'accès, slug..."
                  value={searchCouple}
                  onChange={(e) => setSearchCouple(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 cursor-pointer"
              >
                <option value="all">Tous les Statuts</option>
                <option value="active">Actif</option>
                <option value="trial">Essai (3j)</option>
                <option value="verification">Paiement en Vérification</option>
                <option value="pending_payment">En attente de paiement</option>
                <option value="suspended">Suspendu</option>
                <option value="blocked">Bloqué</option>
              </select>

              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 cursor-pointer"
              >
                <option value="all">Toutes Formules</option>
                <option value="couple">Pack Couple (3 000)</option>
                <option value="individual">Pack Individuel (2 000)</option>
              </select>

              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Exporter CSV
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[960px]">
                  <thead className="bg-[#FCFAF7] border-b border-stone-100 text-[11px] text-stone-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Couple & Emails</th>
                      <th className="p-4">Code d'Accès</th>
                      <th className="p-4">Formule Premium</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Contrôles Premium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredCouples.map((c) => (
                      <tr key={c.id} className="hover:bg-stone-50/60 align-top">
                        <td className="p-4">
                          <strong className="text-stone-900 text-sm block">{c.partner1Name} & {c.partner2Name}</strong>
                          <span className="text-[11px] text-stone-500 block">{c.partner1Email} {c.partner1AccessActive === false && "(désactivé)"}</span>
                          {c.partner2Email && (
                            <span className="text-[11px] text-stone-500 block">{c.partner2Email} {c.partner2AccessActive === false && "(désactivé)"}</span>
                          )}
                          <span className="text-[10px] text-stone-400 font-mono">{c.weddingDate || "Date non fixée"} • {c.city || "Abidjan"} • {c.progressPercent}%</span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono font-bold text-sm text-[#C05638] px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 whitespace-nowrap">
                            {c.accessCode || "Non généré"}
                          </span>
                          <button
                            onClick={() => handleCouplePatch(c.id, { regenerateCode: true }, `Nouveau code généré pour ${c.partner1Name}`)}
                            className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-bold text-[10px] hover:bg-stone-200 cursor-pointer"
                            title="Régénérer le code d'accès"
                          >
                            <KeyRound className="w-3 h-3" />
                            Nouveau code
                          </button>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                              c.planType === "individual"
                                ? "bg-stone-100 text-stone-700"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {c.planType === "individual" ? "Individuelle" : "Couple"}
                          </span>
                          <div className="text-[11px] text-stone-600 font-bold mt-1">
                            {(c.planAmount || 3000).toLocaleString("fr-FR")} FCFA
                          </div>
                          <div className="flex flex-col gap-1 mt-2">
                            <button
                              onClick={() => handleCouplePatch(c.id, { planType: "couple" }, "Passage au Pack Couple")}
                              className="px-2 py-1 rounded-lg bg-amber-50 text-amber-900 font-bold text-[10px] hover:bg-amber-100 cursor-pointer border border-amber-200"
                            >
                              ? Pack Couple
                            </button>
                            <button
                              onClick={() => handleCouplePatch(c.id, { planType: "individual" }, "Passage au Pack Individuel")}
                              className="px-2 py-1 rounded-lg bg-stone-100 text-stone-700 font-bold text-[10px] hover:bg-stone-200 cursor-pointer"
                            >
                              ? Pack Individuel
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                              c.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : c.status === "verification"
                                ? "bg-amber-100 text-amber-800"
                                : c.status === "suspended" || c.status === "blocked"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {c.status}
                          </span>
                          {c.trialEndsAt && c.status === "trial" && (
                            <div className="text-[10px] text-stone-400 mt-1">
                              Essai jusqu’au {new Date(c.trialEndsAt).toLocaleDateString("fr-FR")}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col items-end gap-1.5">
                            {c.status !== "active" && (
                              <button
                                onClick={() => handleCouplePatch(c.id, { activatePremium: true }, `Pack Premium activé pour ${c.partner1Name} & ${c.partner2Name}`)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 cursor-pointer shadow-xs"
                                title="Valider le Pack Premium complet et activer les deux partenaires"
                              >
                                <Crown className="w-3.5 h-3.5" />
                                Valider Pack Premium
                              </button>
                            )}
                            <div className="flex items-center gap-1.5">
                              {c.status === "active" ? (
                                <button
                                  onClick={() => handleCouplePatch(c.id, { status: "suspended" }, "Compte suspendu")}
                                  className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  Suspendre
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCouplePatch(c.id, { status: "active" }, "Compte activé")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  Activer
                                </button>
                              )}
                              <button
                                onClick={() => handleCouplePatch(c.id, { status: c.status === "blocked" ? "active" : "blocked" }, c.status === "blocked" ? "Compte débloqué" : "Compte bloqué")}
                                className="px-2.5 py-1 rounded-lg bg-stone-900 text-white font-bold text-[10px] cursor-pointer inline-flex items-center gap-1"
                              >
                                <Ban className="w-3 h-3" />
                                {c.status === "blocked" ? "Débloquer" : "Bloquer"}
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleCouplePatch(c.id, { extendTrialDays: 7 }, "Essai prolongé de 7 jours")}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-[10px] hover:bg-blue-100 cursor-pointer border border-blue-200"
                                title="Prolonger l'essai de 7 jours"
                              >
                                <CalendarPlus className="w-3 h-3" />
                                +7j essai
                              </button>
                              <button
                                onClick={() => handleCouplePatch(c.id, { partner2AccessActive: !c.partner2AccessActive }, c.partner2AccessActive ? "Accès partenaire 2 désactivé" : "Accès partenaire 2 activé")}
                                className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 font-bold text-[10px] hover:bg-stone-100 cursor-pointer"
                                title="Activer / désactiver l'accès du second partenaire"
                              >
                                {c.partner2AccessActive === false ? "Activer P2" : "Couper P2"}
                              </button>
                              <button
                                onClick={() => handleDeleteCouple(c.id)}
                                className="p-1.5 text-stone-400 hover:text-red-600 cursor-pointer"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENTS */}
        {activeTab === "payments" && (
          <div className="space-y-4 animate-in fade-in text-xs">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-stone-100">
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Validation des Packs Premium — Règlements Wave (Couple 3 000 FCFA / Individuel 2 000 FCFA)
                </h3>
                <p className="text-stone-500 text-xs">
                  Vérifiez la référence Wave, puis validez pour activer immédiatement le Pack Premium complet du couple.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-[#FCFAF7] border-b border-stone-100 text-[11px] text-stone-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Couple & Payeur</th>
                      <th className="p-4">Montant & Formule</th>
                      <th className="p-4">Référence Wave</th>
                      <th className="p-4">Preuve</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Décision Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {paymentsList.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/60">
                        <td className="p-4">
                          <strong className="text-stone-900 block">{p.coupleName}</strong>
                          <span className="text-[10px] text-stone-500 block">{p.payerEmail || p.coupleEmail}</span>
                          <span className="text-[10px] text-stone-400 font-mono">{p.paymentDate}</span>
                        </td>
                        <td className="p-4">
                          <strong className="font-serif font-bold text-stone-900 block">
                            {p.amount?.toLocaleString("fr-FR")} FCFA
                          </strong>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.planType === "individual"
                                ? "bg-stone-100 text-stone-700"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {p.planType === "individual" ? "Individuelle" : "Couple"}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-blue-800">
                          {p.referenceNumber}
                        </td>
                        <td className="p-4">
                          {p.proofImageUrl ? (
                            <a href={p.proofImageUrl} target="_blank" rel="noreferrer" className="text-blue-700 font-bold hover:underline">
                              Voir la preuve
                            </a>
                          ) : (
                            <span className="text-stone-400">Aucune</span>
                          )}
                          {p.adminNotes && (
                            <p className="text-[10px] text-stone-500 mt-1 max-w-[220px]">{p.adminNotes}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                              p.status === "verified"
                                ? "bg-emerald-100 text-emerald-800"
                                : p.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {p.status === "verified" ? "Validé ?" : p.status === "rejected" ? "Rejeté" : p.status === "need_new_proof" ? "Nouvelle preuve" : "En attente"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            {p.status !== "verified" && (
                              <button
                                onClick={() => handlePaymentAction(p.id, "accept")}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1"
                              >
                                <Crown className="w-3.5 h-3.5" />
                                Valider & Activer Premium
                              </button>
                            )}
                            <div className="flex items-center gap-1.5">
                              {p.status !== "verified" && p.status !== "need_new_proof" && (
                                <button
                                  onClick={() => handlePaymentAction(p.id, "request_new_proof")}
                                  className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-bold text-[10px] hover:bg-amber-200 cursor-pointer"
                                >
                                  Demander preuve
                                </button>
                              )}
                              {p.status !== "rejected" && (
                                <button
                                  onClick={() => handlePaymentAction(p.id, "reject")}
                                  className="px-2.5 py-1 rounded-xl bg-red-100 text-red-800 font-bold text-[10px] hover:bg-red-200 cursor-pointer"
                                >
                                  Rejeter
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB PROVIDERS */}
        {activeTab === "providers" && (
          <div className="space-y-4 animate-in fade-in text-xs">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-stone-100">
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Validation des Prestataires — Marketplace
                </h3>
                <p className="text-stone-500 text-xs">
                  Verifiez les photos et le WhatsApp, puis validez pour rendre la fiche visible publiquement.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-[#FCFAF7] border-b border-stone-100 text-[11px] text-stone-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Entreprise & Contact</th>
                      <th className="p-4">Service & Ville</th>
                      <th className="p-4">WhatsApp</th>
                      <th className="p-4">Photos</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Decision Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {providersList.map((prov) => (
                      <tr key={prov.id} className="hover:bg-stone-50/60">
                        <td className="p-4">
                          <strong className="text-stone-900 block">{prov.businessName}</strong>
                          <span className="text-[10px] text-stone-500 block">{prov.contactName}</span>
                          {prov.email && (
                            <span className="text-[10px] text-stone-400 block">{prov.email}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <strong className="font-serif font-bold text-stone-900 block">{prov.service}</strong>
                          <span className="text-[10px] text-stone-500">{prov.city}</span>
                          {prov.priceFrom > 0 && (
                            <span className="text-[10px] text-stone-400 block">
                              A partir de {prov.priceFrom?.toLocaleString("fr-FR")} FCFA
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-blue-800">{prov.whatsapp}</td>
                        <td className="p-4">
                          {prov.photos && prov.photos.length > 0 ? (
                            <span className="text-emerald-700 font-bold">{prov.photos.length} photo(s)</span>
                          ) : (
                            <span className="text-stone-400">Aucune</span>
                          )}
                          {prov.adminNotes && (
                            <p className="text-[10px] text-stone-500 mt-1 max-w-[220px]">{prov.adminNotes}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                              prov.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : prov.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : prov.status === "suspended"
                                ? "bg-stone-200 text-stone-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {prov.status === "approved" ? "Valide" : prov.status === "rejected" ? "Rejete" : prov.status === "suspended" ? "Suspendu" : "En attente"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            {prov.status !== "approved" && (
                              <button
                                onClick={() => handleProviderAction(prov.id, "approve")}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Valider
                              </button>
                            )}
                            <div className="flex items-center gap-1.5">
                              {prov.status !== "suspended" && prov.status === "approved" && (
                                <button
                                  onClick={() => handleProviderAction(prov.id, "suspend")}
                                  className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-bold text-[10px] hover:bg-amber-200 cursor-pointer"
                                >
                                  Suspendre
                                </button>
                              )}
                              {prov.status !== "rejected" && (
                                <button
                                  onClick={() => handleProviderAction(prov.id, "reject")}
                                  className="px-2.5 py-1 rounded-xl bg-red-100 text-red-800 font-bold text-[10px] hover:bg-red-200 cursor-pointer"
                                >
                                  Rejeter
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GAMES */}
        {activeTab === "games" && (
          <div className="space-y-6 animate-in fade-in text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Parties Totales</span>
                <div className="font-serif font-black text-2xl text-stone-900">
                  {gamesAdminData?.totalMatches || 0}
                </div>
                <span className="text-stone-500 text-[11px]">Enregistrées en base</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Ludo Nuptial</span>
                <div className="font-serif font-black text-2xl text-[#C05638]">
                  {gamesAdminData?.breakdown?.ludo || 0}
                </div>
                <span className="text-stone-500 text-[11px]">Parties jouées</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Awalé Ivoirien</span>
                <div className="font-serif font-black text-2xl text-[#7A4E2D]">
                  {gamesAdminData?.breakdown?.awale || 0}
                </div>
                <span className="text-stone-500 text-[11px]">Parties jouées</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Dames & Mots</span>
                <div className="font-serif font-black text-2xl text-amber-700">
                  {(gamesAdminData?.breakdown?.dames || 0) + (gamesAdminData?.breakdown?.mots || 0)}
                </div>
                <span className="text-stone-500 text-[11px]">Parties jouées</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Historique Récent des Parties de Couples
                </h3>
                <span className="text-stone-500 text-xs">
                  Dernières parties enregistrées
                </span>
              </div>

              {gamesAdminData?.recentGames?.length === 0 ? (
                <p className="text-stone-500 text-center py-6">Aucune partie encore enregistrée.</p>
              ) : (
                <div className="space-y-2">
                  {gamesAdminData?.recentGames?.map((match: any) => (
                    <div
                      key={match.id}
                      className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 capitalize font-serif text-sm">
                            {match.gameType === "awale" ? "Awalé Ivoirien" : match.gameType === "ludo" ? "Ludo Nuptial" : match.gameType === "dames" ? "Jeu de Dames" : "Défi des Mots"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-bold uppercase">
                            {match.mode}
                          </span>
                        </div>
                        <p className="text-stone-600 text-[11px] mt-0.5">
                          {match.player1Name} ({match.score1}) vs {match.player2Name} ({match.score2})
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                          Gagnant : {match.winner === "partner1" ? match.player1Name : match.winner === "partner2" ? match.player2Name : match.winner === "draw" ? "Égalité" : "IA"}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {match.completedAt ? new Date(match.completedAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT */}
        {activeTab === "audit" && (
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">Journal d'audit des actions sensibles</h3>
              <span className="text-xs text-stone-500">{auditList.length} entrée(s)</span>
            </div>
            {auditList.length === 0 ? (
              <p className="text-stone-500 text-center py-6 text-xs">Aucune action sensible enregistrée pour le moment.</p>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto">
                {auditList.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <strong className="text-stone-900">{log.action}</strong>
                      <span className="text-stone-500"> — {log.coupleName} • par {log.adminName}</span>
                      {log.details && <p className="text-stone-600 text-[11px] mt-0.5">{log.details}</p>}
                    </div>
                    <span className="text-[10px] text-stone-400 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString("fr-FR") : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
            <form onSubmit={handleSettingsSave} className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-serif font-bold text-stone-900 text-base border-b border-stone-100 pb-3">
                Compte Administrateur
              </h3>
              {settingsMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-center">
                  {settingsMsg}
                </div>
              )}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Email de connexion</label>
                <input
                  type="email"
                  value={adminUser?.email || ""}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-500"
                />
              </div>
              <div>
                <label className="block text-stone-700 font-bold mb-1">Nom affiché</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900"
                />
              </div>
              <div>
                <label className="block text-stone-700 font-bold mb-1">Mot de passe actuel (requis pour changer)</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900"
                />
              </div>
              <div>
                <label className="block text-stone-700 font-bold mb-1">Nouveau mot de passe (min. 8 caractères)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-stone-900 text-white font-bold hover:bg-stone-800 cursor-pointer"
              >
                Enregistrer les paramètres
              </button>
            </form>

            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-serif font-bold text-stone-900 text-base border-b border-stone-100 pb-3">
                Règles du Pack Premium
              </h3>
              <ul className="space-y-2.5 text-stone-700 leading-relaxed">
                <li><strong>Pack Couple — 3 000 FCFA :</strong> accès complet et simultané des deux partenaires, tous modules débloqués.</li>
                <li><strong>Pack Individuel — 2 000 FCFA :</strong> accès complet d’un seul partenaire ; le second reste désactivé.</li>
                <li><strong>Validation :</strong> « Valider & Activer Premium » active le statut, la formule et les deux accès, puis notifie le couple avec son code.</li>
                <li><strong>Essai :</strong> 3 jours gratuits, prolongeables par tranches de 7 jours depuis le tableau Couples.</li>
                <li><strong>Traçabilité :</strong> chaque activation, suspension, blocage et changement de formule est consigné dans le journal d’audit.</li>
              </ul>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

