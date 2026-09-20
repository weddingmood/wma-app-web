"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { COLOR_THEMES, FONTS_LIST, ThemeDefinition } from "@/lib/constants";

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
  switchPartner: (p: "partner1" | "partner2") => Promise<void>;
  updatePreferences: (newPrefs: Partial<CouplePreferences>) => Promise<void>;
  updateCoupleProfile: (profileUpdates: Partial<CoupleProfile>) => Promise<void>;
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

  const activeTheme = COLOR_THEMES.find((t) => t.id === preferences.themeId) || COLOR_THEMES[0];

  const refreshCoupleData = useCallback(async () => {
    try {
      const res = await fetch("/api/auth");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.couple) {
          setCouple(data.couple);
          if (data.preferences) {
            setPreferences({
              themeId: data.preferences.themeId || 1,
              fontFamily: data.preferences.fontFamily || "cormorant",
              displayMode: data.preferences.displayMode || "standard",
              density: data.preferences.density || "normal",
              fontSize: data.preferences.fontSize || "md",
              coverPhotoUrl: data.preferences.coverPhotoUrl,
            });
          }
          if (data.activePartner) {
            setActivePartner(data.activePartner);
          }
        }
      }

      // Check notifications
      const notifRes = await fetch("/api/notifications");
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        if (notifData.success) {
          setUnreadNotifications(notifData.unreadCount || 0);
        }
      }
    } catch {
      setSyncState("Hors connexion");
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

  const switchPartner = async (p: "partner1" | "partner2") => {
    setActivePartner(p);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch-partner", partner: p }),
      });
      await refreshCoupleData();
    } catch {
      // offline fallback
    }
  };

  const updatePreferences = async (newPrefs: Partial<CouplePreferences>) => {
    const merged = { ...preferences, ...newPrefs };
    setPreferences(merged);
    try {
      setSyncState("Synchronisation en cours");
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs),
      });
      if (res.ok) {
        setSyncState("Synchronisé");
      } else {
        setSyncState("Modifications en attente");
      }
    } catch {
      setSyncState("Modifications en attente");
    }
  };

  const updateCoupleProfile = async (profileUpdates: Partial<CoupleProfile>) => {
    if (couple) {
      setCouple({ ...couple, ...profileUpdates });
    }
    try {
      setSyncState("Synchronisation en cours");
      const res = await fetch("/api/couples", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileUpdates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.couple) {
          setCouple(data.couple);
        }
        setSyncState("Synchronisé");
      } else {
        setSyncState("Modifications en attente");
      }
    } catch {
      setSyncState("Modifications en attente");
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
        switchPartner,
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

