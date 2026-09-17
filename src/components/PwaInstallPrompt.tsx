"use client";

import { useEffect, useState } from "react";
import { Smartphone, X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem("wm-pwa-dismissed") === "1") setDismissed(true);
      if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    } catch {
      /* ignore */
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred || dismissed || installed) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4">
      <div className="glass-panel border border-stone-200 rounded-3xl p-4 shadow-xl flex items-start gap-3">
        <div className="p-2.5 rounded-2xl bg-[#C05638]/10 text-[#C05638] shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-bold text-stone-900 text-sm">Installer Wedding Mood</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Ajoutez l’application sur votre écran d’accueil pour un accès rapide, même hors connexion.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={async () => {
                await deferred.prompt();
                const { outcome } = await deferred.userChoice;
                if (outcome === "accepted") setDeferred(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C05638] text-white text-xs font-bold hover:bg-[#A84429] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Installer
            </button>
            <button
              onClick={() => {
                setDismissed(true);
                try {
                  localStorage.setItem("wm-pwa-dismissed", "1");
                } catch {
                  /* ignore */
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
