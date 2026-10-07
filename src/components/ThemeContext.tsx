"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { COLOR_THEMES, FONTS_LIST, ThemeDefinition } from "@/lib/constants";
import { buildCustomTheme } from "@/lib/custom-theme";

export interface CoupleProfile {
  id: number;
  slug: string;
  partner1Name: string;
  partner2Name: string;
  partner1Email: string;
  partner2Email?: string | null;
  partner1Role?: string | null;
  partner2Role?: string | null;
  partner1Photo?: string | null;
  partner2Photo?: string | null;
  coverPhoto?: string | null;
  weddingDate?: string | null;
  city?: string | null;
  venue?: string | null;
  totalBudget?: number | null;
  estimatedGuests?: number | null;
  ceremonyTypes?: string[] | null;
  church?: string | null;
  pastorName?: string | null;
  ethnicity?: string | null;
  traditions?: string | null;
  bibleVerse?: string | null;
  status?: string | null;
  trialEndsAt?: string | null;
}

export interface CouplePreferences {
  themeId: number;
  fontFamily: string;
  displayMode: "standard" | "simplified" | "organization" | "elegant";
  density: "compact" | "normal" | "spacious";
  fontSize: "sm" | "md" | "lg";
  coverPhotoUrl?: string | null;
}

export type SyncState = "Synchronisé" | "Synchronisation en cours" | "Hors connexion" | "Modifications en attente";

interface ThemeContextType {
  couple: CoupleProfile | null;
  preferences: CouplePreferences;
  activeTheme: ThemeDefinition;
  activePartner: "partner1" | "partner2";
  partnerName: string;
  partnerPhoto: string;
  partnerRole: string;
  otherPartnerName: string;
  otherPartnerPhoto: string;
  syncState: SyncState;
  unreadNotifications: number;
  isCallOpen: boolean;
  callType: "audio" | "video";
  updatePreferences: (newPrefs: Partial<CouplePreferences>) => Promise<boolean>;
  updateCoupleProfile: (profileUpdates: Partial<CoupleProfile>) => Promise<boolean>;
  refreshCoupleData: () => Promise<void>;
  startCall: (type: "audio" | "video") => void;
  closeCall: () => void;
  triggerSync: () => Promise<void>;
}

const defaultPreferences: CouplePreferences = {
  themeId: 1,
  fontFamily: "cormorant",
  displayMode: "standard",
  density: "normal",
  fontSize: "md",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [couple, setCouple] = useState<CoupleProfile | null>(null);
  const [preferences, setPreferences] = useState<CouplePreferences>(defaultPreferences);
  const [activePartner, setActivePartner] = useState<"partner1" | "partner2">("partner1");
  const [syncState, setSyncState] = useState<SyncState>("Synchronisé");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("video");
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [customBase, setCustomBase] = useState<number | null>(null);

  useEffect(() => {
    const loadCustomColor = () => {
      fetch("/api/theme-color", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && d.success && typeof d.color === "string") {
            setCustomColor(d.color);
            setCustomBase(typeof d.baseThemeId === "number" ? d.baseThemeId : null);
          } else {
            setCustomColor(null);
            setCustomBase(null);
          }
        })
        .catch(() => {});
    };
    loadCustomColor();
    window.addEventListener("wm-custom-color", loadCustomColor);
    return () => window.removeEventListener("wm-custom-color", loadCustomColor);
  }, []);

  const baseTheme = COLOR_THEMES.find((t) => t.id === preferences.themeId) || COLOR_THEMES[0];
  const customActive = Boolean(customColor) && (customBase === null || customBase === preferences.themeId);
  const activeTheme: ThemeDefinition = customActive && customColor ? buildCustomTheme(customColor, baseTheme) : baseTheme;

  const refreshCoupleData = useCallback(async () => {
    let authData;
    try {
      const res = await fetch("/api/auth", { cache: "no-store" });

      if (!res.ok) {
        if (res.status === 401) setCouple(null);
        setSyncState(res.status === 401 ? "Hors connexion" : "Modifications en attente");
        return;
      }

      authData = await res.json();

      if (!authData.success || !authData.couple) {
        setCouple(null);
        setSyncState("Hors connexion");
        return;
      }

      setCouple({
        ...authData.couple,
        coverPhoto: authData.preferences?.coverPhotoUrl ?? null,
      });

      if (authData.preferences) {
        setPreferences({
          themeId: authData.preferences.themeId || 1,
          fontFamily: authData.preferences.fontFamily || "cormorant",
          displayMode: authData.preferences.displayMode || "standard",
          density: authData.preferences.density || "normal",
          fontSize: authData.preferences.fontSize || "md",
          coverPhotoUrl: authData.preferences.coverPhotoUrl,
        });
      }

      if (authData.activePartner) {
        setActivePartner(authData.activePartner);
      }

      setSyncState("Synchronisé");
    } catch {
      setSyncState("Hors connexion");
      return;
    }

    try {
      const notifRes = await fetch("/api/notifications", { cache: "no-store" });

      if (notifRes.ok) {
        const notifData = await notifRes.json();

        if (notifData.success) {
          setUnreadNotifications(notifData.unreadCount || 0);
        }
      }
    } catch {
      // Les notifications ne doivent pas bloquer les donn?es du couple.
    }
  }, []);

  useEffect(() => {
    refreshCoupleData();

    const handleOnline = () => {
      setSyncState("Synchronisation en cours");
      setTimeout(() => {
        setSyncState("Synchronisé");
      }, 1200);
    };

    const handleOffline = () => {
      setSyncState("Hors connexion");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshCoupleData]);

  const updatePreferences = async (newPrefs: Partial<CouplePreferences>) => {
    const previous = preferences;
    setPreferences({ ...preferences, ...newPrefs });

    try {
      setSyncState("Synchronisation en cours");

      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs),
      });

      if (res.ok) {
        setSyncState("Synchronisé");
        return true;
      }

      setPreferences(previous);
      setSyncState("Modifications en attente");
      return false;
    } catch {
      setPreferences(previous);
      setSyncState("Modifications en attente");
      return false;
    }
  };
  const updateCoupleProfile = async (profileUpdates: Partial<CoupleProfile>) => {
    const { coverPhoto, ...profileRest } = profileUpdates;

    if (coverPhoto !== undefined) {
      const saved = await updatePreferences({ coverPhotoUrl: coverPhoto });

      if (!saved) return false;

      setCouple((prev) => (prev ? { ...prev, coverPhoto } : prev));
    }

    if (Object.keys(profileRest).length === 0) return true;

    try {
      setSyncState("Synchronisation en cours");

      const res = await fetch("/api/couples", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileRest),
      });

      if (!res.ok) {
        setSyncState("Modifications en attente");
        return false;
      }

      const data = await res.json();

      if (!data?.success || !data.couple) {
        setSyncState("Modifications en attente");
        return false;
      }

      setCouple((prev) => ({
        ...data.couple,
        coverPhoto: prev?.coverPhoto ?? null,
      }));

      setSyncState("Synchronisé");
      return true;
    } catch {
      setSyncState("Modifications en attente");
      return false;
    }
  };
  const triggerSync = async () => {
    setSyncState("Synchronisation en cours");
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue: [] }),
      });
      setTimeout(() => setSyncState("Synchronisé"), 800);
    } catch {
      setSyncState("Hors connexion");
    }
  };

  const startCall = (type: "audio" | "video") => {
    setCallType(type);
    setIsCallOpen(true);
  };

  const closeCall = () => {
    setIsCallOpen(false);
  };

  const partnerName =
    activePartner === "partner2"
      ? couple?.partner2Name || "Épouse (Elle)"
      : couple?.partner1Name || "Époux (Lui)";

  const partnerRole =
    activePartner === "partner2"
      ? "Fiancée & Future Mariée"
      : "Fiancé & Futur Marié";

  const partnerPhoto =
    activePartner === "partner2"
      ? couple?.partner2Photo || "https://images.pexels.com/photos/37828098/pexels-photo-37828098.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400"
      : couple?.partner1Photo || "https://images.pexels.com/photos/34887758/pexels-photo-34887758.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400";

  const otherPartnerName =
    activePartner === "partner1"
      ? couple?.partner2Name || "Épouse (Elle)"
      : couple?.partner1Name || "Époux (Lui)";

  const otherPartnerPhoto =
    activePartner === "partner1"
      ? couple?.partner2Photo || "https://images.pexels.com/photos/37828098/pexels-photo-37828098.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400"
      : couple?.partner1Photo || "https://images.pexels.com/photos/34887758/pexels-photo-34887758.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400";

  // Apply theme, font and font size to document root dynamically
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--wm-primary", activeTheme.primary);
    root.style.setProperty("--wm-primary-hover", activeTheme.primaryHover);
    root.style.setProperty("--wm-secondary", activeTheme.secondary);
    root.style.setProperty("--wm-accent-gold", activeTheme.accent);

    // Conserve les classes de base du layout et ajoute uniquement les classes de personnalisation
    const baseClasses = "bg-[#F8FAFC] text-stone-900 antialiased min-h-screen";
    document.body.className = `${baseClasses} font-family-${preferences.fontFamily} font-size-${preferences.fontSize} display-mode-${preferences.displayMode}`;
  }, [activeTheme, preferences]);

  return (
    <ThemeContext.Provider
      value={{
        couple,
        preferences,
        activeTheme,
        activePartner,
        partnerName,
        partnerPhoto,
        partnerRole,
        otherPartnerName,
        otherPartnerPhoto,
        syncState,
        unreadNotifications,
        isCallOpen,
        callType,
        updatePreferences,
        updateCoupleProfile,
        refreshCoupleData,
        startCall,
        closeCall,
        triggerSync,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

