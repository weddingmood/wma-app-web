"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeContext";
import { Logo } from "./Logo";
import {
  Phone,
  Video,
  Bell,
  RefreshCw,
  Wifi,
  WifiOff,
  MessageCircle,
  Menu,
  X,
  Camera,
  Heart,
  User,
  Sliders,
} from "lucide-react";
import { OFFICIAL_WHATSAPP_URL } from "@/lib/constants";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const {
    couple,
    activePartner,
    partnerName,
    partnerPhoto,
    partnerRole,
    syncState,
    switchPartner,
    startCall,
    triggerSync,
    unreadNotifications,
    updateCoupleProfile,
    activeTheme,
  } = useTheme();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoInput, setPhotoInput] = useState(partnerPhoto);

  const fetchNotifs = async () => {
    setShowNotifMenu(!showNotifMenu);
    if (!showNotifMenu) {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setNotificationsList(data.notifications || []);
          }
        }
      } catch {
        // ignore
      }
    }
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoInput) return;
    if (activePartner === "partner1") {
      await updateCoupleProfile({ partner1Photo: photoInput });
    } else {
      await updateCoupleProfile({ partner2Photo: photoInput });
    }
    setIsPhotoModalOpen(false);
  };

  const getSyncBadge = () => {
    switch (syncState) {
      case "Synchronisé":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Synchronisé</span>
          </span>
        );
      case "Synchronisation en cours":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span className="hidden sm:inline">En cours...</span>
          </span>
        );
      case "Modifications en attente":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden sm:inline">En attente</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-stone-100 text-stone-600 border border-stone-200">
            <WifiOff className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Hors ligne</span>
          </span>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Left: Mobile Toggle & Official Logo on pure white base */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 focus:outline-none cursor-pointer"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/dashboard" className="flex items-center p-1 bg-white rounded-2xl shadow-2xs border border-stone-200/60">
              <Logo size={42} showText={true} />
            </Link>
          </div>

          {/* Center: Sync Status & Couple Greeting */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={triggerSync}
              title="Cliquez pour synchroniser immédiatement"
              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              {getSyncBadge()}
            </button>

            {couple && (
              <div className="text-xs text-stone-600">
                <span className="font-serif font-bold text-stone-900">{couple.partner1Name}</span> &{" "}
                <span className="font-serif font-bold text-stone-900">{couple.partner2Name}</span>
              </div>
            )}
          </div>

          {/* Right: Partner Switcher, User Avatar, Audio/Video, WhatsApp, Notifications */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Active Partner Switcher Pills (Elle / Lui) */}
            <div className="relative inline-flex items-center bg-white/90 p-1 rounded-2xl border border-stone-200 shadow-2xs text-xs">
              <button
                onClick={() => switchPartner("partner1")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activePartner === "partner1"
                    ? "bg-[#C05638] text-white shadow-xs font-semibold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                style={activePartner === "partner1" ? { backgroundColor: activeTheme.primary } : {}}
                title="Basculer sur le compte de Époux (Lui)"
              >
                Lui
              </button>
              <button
                onClick={() => switchPartner("partner2")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activePartner === "partner2"
                    ? "bg-[#C05638] text-white shadow-xs font-semibold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                style={activePartner === "partner2" ? { backgroundColor: activeTheme.primary } : {}}
                title="Basculer sur le compte de Épouse (Elle)"
              >
                Elle
              </button>
            </div>

            {/* User Profile Avatar with Click Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl glass-card-warm border border-stone-200 hover:border-stone-300 transition-all cursor-pointer shadow-2xs"
                title="Mon profil et ma photo"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-xs bg-stone-100 shrink-0">
                  <img
                    src={partnerPhoto}
                    alt={partnerName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="w-full h-full flex items-center justify-center font-bold text-xs text-[#C05638]">
                    {partnerName.charAt(0)}
                  </span>
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-stone-900 truncate max-w-[90px]">
                    {partnerName.split(" ")[0]}
                  </span>
                  <span className="text-[10px] text-stone-500 capitalize leading-tight">
                    {activePartner === "partner1" ? "Fiancé" : "Fiancée"}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 glass-panel rounded-3xl shadow-xl border border-stone-200 p-4 z-50 animate-in fade-in space-y-3">
                  <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
                    <img
                      src={partnerPhoto}
                      alt={partnerName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37] shadow-xs"
                    />
                    <div>
                      <h4 className="font-serif font-bold text-stone-900 text-sm">{partnerName}</h4>
                      <p className="text-[11px] text-[#C05638] font-semibold">{partnerRole}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setIsPhotoModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4 text-[#C05638]" />
                    <span>Changer ma photo de profil</span>
                  </button>

                  <Link
                    href="/dashboard/preferences"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full py-2 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Sliders className="w-4 h-4 text-stone-500" />
                    <span>Personnalisation & Thèmes</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Audio Call Button */}
            <button
              onClick={() => startCall("audio")}
              className="p-2 text-stone-600 hover:text-[#C05638] hover:bg-white rounded-full transition-colors cursor-pointer"
              title="Appel audio avec votre fiancé(e)"
            >
              <Phone className="w-4 h-4" />
            </button>

            {/* Quick Video Call Button */}
            <button
              onClick={() => startCall("video")}
              className="p-2 text-stone-600 hover:text-[#C05638] hover:bg-white rounded-full transition-colors cursor-pointer"
              title="Appel vidéo direct"
            >
              <Video className="w-4 h-4" />
            </button>

            {/* WhatsApp Support CI */}
            <a
              href={OFFICIAL_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
              title="Assistance WhatsApp Officielle (+225 70 50 13 56)"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            {/* Notifications Trigger */}
            <div className="relative">
              <button
                onClick={fetchNotifs}
                className="relative p-2 text-stone-600 hover:text-stone-900 rounded-full hover:bg-white transition-colors cursor-pointer"
                title="Notifications du couple"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600"></span>
                )}
              </button>

              {/* Notification Drawer Dropdown with Glass Translucency */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 glass-panel rounded-3xl shadow-xl border border-stone-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                    <h4 className="font-serif font-bold text-stone-900 text-sm">Notifications du Couple</h4>
                    <button
                      onClick={() => setShowNotifMenu(false)}
                      className="text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notificationsList.length === 0 ? (
                      <p className="text-xs text-stone-500 text-center py-4">Aucune nouvelle notification.</p>
                    ) : (
                      notificationsList.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-2xl text-xs border ${
                            n.isRead
                              ? "bg-white/80 border-stone-100 text-stone-600"
                              : "bg-orange-50/90 border-orange-200 text-stone-900 font-medium"
                          }`}
                        >
                          <div className="font-bold mb-0.5">{n.title}</div>
                          <div className="text-stone-600">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Photo Change Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Modifier la Photo de {partnerName}
              </h3>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={photoInput || partnerPhoto}
                  alt="Aperçu"
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#D4AF37] shadow-md"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  URL de votre photo de profil (Lien direct JPG / PNG)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={photoInput}
                  onChange={(e) => setPhotoInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C05638] text-white font-bold cursor-pointer hover:bg-[#A84429]"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

