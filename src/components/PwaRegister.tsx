"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      // Une nouvelle version du service worker vient de prendre le contrôle :
      // on recharge une seule fois pour afficher immédiatement la nouvelle interface.
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    // Ne pas recharger lors de la toute première installation (pas d'ancien SW)
    const hadController = !!navigator.serviceWorker.controller;
    if (hadController) {
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        // Vérifie tout de suite s'il existe une version plus récente
        registration.update().catch(() => {});
      } catch {
        // Service worker optionnel : l'app reste utilisable sans lui
      }
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);
  return null;
}
