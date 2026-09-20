"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  Smartphone,
  Download,
  QrCode,
  ShieldCheck,
  WifiOff,
  Bell,
  Zap,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  Monitor,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export default function DownloadPage() {
  const [apkInfo, setApkInfo] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/download/info")
      .then((r) => r.json())
      .then((d) => d.success && setApkInfo(d))
      .catch(() => {});

    const url = `${window.location.origin}/telechargement`;
    QRCode.toDataURL(url, { width: 280, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => {});

    const onPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__wmInstallPrompt = e;
      setCanInstallPwa(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const handlePwaInstall = async () => {
    const deferred = (window as any).__wmInstallPrompt;
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
    }
  };

  const handleApkDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/download/apk");
      if (!res.ok) throw new Error("indisponible");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = apkInfo?.fileName || "wedding-mood-v1.0.0.apk";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open("/api/download/apk", "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const sizeLabel = apkInfo?.sizeBytes
    ? `${(apkInfo.sizeBytes / 1024).toFixed(1)} Ko`
    : "—";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-stone-900 pb-20">
      <header className="sticky top-0 z-40 glass-panel border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={38} showText />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold hover:bg-stone-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à l’application
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div className="p-6 sm:p-10 rounded-3xl glass-panel border border-stone-200 shadow-sm text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-bold border border-orange-100">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Application mobile officielle • v{apkInfo?.version || "1.0.0"}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">
            Télécharger Wedding Mood
          </h1>
          <p className="text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Installez l’application sur votre téléphone Android : accès plein écran, fonctionnement
            hors connexion, notifications et synchronisation automatique avec votre conjoint.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-stone-500">
            <span className="px-2.5 py-1 rounded-full bg-white border border-stone-200 font-mono">
              {apkInfo?.packageName || "ci.weddingmood.app"}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white border border-stone-200">
              {apkInfo?.minAndroid || "Android 9+"}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white border border-stone-200">
              Taille : {sizeLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option 1 : PWA */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#C05638]/40 shadow-md space-y-4">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              Méthode recommandée
            </span>
            <h2 className="font-serif text-xl font-bold">1. Installer la Web App</h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Installation instantanée depuis votre navigateur, sans fichier à télécharger.
              Mises à jour automatiques à chaque visite.
            </p>
            <ol className="space-y-2 text-xs text-stone-700">
              {[
                "Ouvrez cette page dans Chrome sur Android.",
                "Touchez « Installer » ci-dessous ou « Ajouter à l’écran d’accueil » dans le menu.",
                "Validez : l’icône Wedding Mood apparaît avec démarrage plein écran.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#C05638] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={handlePwaInstall}
              disabled={!canInstallPwa}
              className="w-full py-3.5 rounded-2xl bg-[#C05638] text-white font-bold text-xs shadow-md hover:bg-[#A84429] disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {canInstallPwa ? "Installer maintenant" : "Ouvrez dans Chrome Android pour installer"}
            </button>
          </div>

          {/* Option 2 : APK */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-900 text-white uppercase tracking-wider">
              Fichier APK
            </span>
            <h2 className="font-serif text-xl font-bold">2. Télécharger le fichier APK</h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Paquet Android officiel généré depuis l’application validée. Idéal pour partager
              l’application par WhatsApp, Bluetooth ou clé USB.
            </p>
            <ol className="space-y-2 text-xs text-stone-700">
              {[
                "Téléchargez le fichier APK ci-dessous.",
                "Ouvrez le fichier et autorisez « Sources inconnues » si demandé.",
                "Touchez « Installer », puis ouvrez Wedding Mood.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={handleApkDownload}
              disabled={downloading}
              className="w-full py-3.5 rounded-2xl bg-stone-900 text-white font-bold text-xs shadow-md hover:bg-stone-800 cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Téléchargement..." : `Télécharger l’APK (${sizeLabel})`}
            </button>
            <p className="text-[10px] text-stone-400 text-center">
              {apkInfo?.fileName} • Vérifié par l’équipe Wedding Mood
            </p>
          </div>
        </div>

        {/* QR + avantages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm font-bold">
              <QrCode className="w-4 h-4 text-[#C05638]" />
              Partager par QR Code
            </div>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code de téléchargement" className="w-48 h-48 mx-auto rounded-2xl border border-stone-200 p-2 bg-white" />
            ) : (
              <div className="w-48 h-48 mx-auto rounded-2xl bg-stone-100 animate-pulse" />
            )}
            <p className="text-xs text-stone-500">
              Scannez ce code avec un téléphone pour ouvrir cette page de téléchargement.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg">Pourquoi installer l’application ?</h3>
            <div className="space-y-3 text-xs">
              {[
                { icon: Zap, title: "Démarrage instantané", desc: "Ouverture plein écran depuis votre écran d’accueil." },
                { icon: WifiOff, title: "Mode hors connexion", desc: "Tâches, budget, prières et jeux accessibles sans Internet." },
                { icon: Bell, title: "Rappels du couple", desc: "Échéances, validations et messages synchronisés." },
                { icon: ShieldCheck, title: "Données protégées", desc: "Espace privé isolé par couple, sessions sécurisées." },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-stone-200">
                  <f.icon className="w-4 h-4 text-[#C05638] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900">{f.title}</strong>
                    <span className="text-stone-500">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1">
              <Monitor className="w-4 h-4" />
              Sur ordinateur : utilisez Chrome puis « Installer Wedding Mood » dans la barre d’adresse.
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-stone-400 pb-4">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-stone-700 font-semibold">
            Découvrir Wedding Mood <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </main>
    </div>
  );
}

