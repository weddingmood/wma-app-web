"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Sparkles } from "lucide-react";

export function CallModal() {
  const { isCallOpen, callType, closeCall, couple, activePartner } = useTheme();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<"connecting" | "connected">("connecting");

  const otherPartnerName =
    activePartner === "partner1"
      ? couple?.partner2Name || "Épouse (Fiancée)"
      : couple?.partner1Name || "Époux (Fiancé)";

  const otherPartnerPhoto =
    activePartner === "partner1"
      ? couple?.partner2Photo || "https://images.pexels.com/photos/37828098/pexels-photo-37828098.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400"
      : couple?.partner1Photo || "https://images.pexels.com/photos/34887758/pexels-photo-34887758.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400";

  useEffect(() => {
    if (!isCallOpen) {
      setCallDuration(0);
      setCallStatus("connecting");
      return;
    }

    const connectTimeout = setTimeout(() => {
      setCallStatus("connected");
    }, 2000);

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(connectTimeout);
      clearInterval(timer);
    };
  }, [isCallOpen]);

  if (!isCallOpen) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center text-white">
        
        {/* Header bar */}
        <div className="w-full flex items-center justify-between px-6 py-4 bg-stone-950/60 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
              {callType === "video" ? "Appel Vidéo Direct" : "Appel Audio Direct"}
            </span>
          </div>
          <div className="text-xs px-3 py-1 bg-stone-800 rounded-full font-mono text-stone-300">
            {callStatus === "connecting" ? "Connexion en cours..." : formatDuration(callDuration)}
          </div>
        </div>

        {/* Video / Profile Stage */}
        <div className="relative w-full h-80 sm:h-96 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-stone-900 to-stone-950">
          {callType === "video" && !isVideoOff ? (
            <div className="relative w-full h-full">
              <img
                src={otherPartnerPhoto}
                alt={otherPartnerName}
                className="w-full h-full object-cover filter brightness-90"
              />
              <div className="absolute top-4 right-4 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg bg-stone-800">
                <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 text-stone-400 text-xs text-center p-2">
                  <User className="w-6 h-6 mb-1 text-stone-500" />
                  <span>Ma caméra</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-6">
              <div className="relative mb-4">
                <img
                  src={otherPartnerPhoto}
                  alt={otherPartnerName}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-[#D4AF37] shadow-xl"
                />
                <span className="absolute bottom-1 right-1 p-2 bg-[#C05638] rounded-full text-white shadow-md">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white mb-1">{otherPartnerName}</h3>
              <p className="text-sm text-stone-400">
                {callStatus === "connecting" ? "Appel de votre fiancé(e)..." : "En communication privée"}
              </p>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="w-full flex items-center justify-center gap-6 py-6 bg-stone-950 border-t border-stone-800">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition-all cursor-pointer ${
              isMuted ? "bg-red-600 text-white" : "bg-stone-800 hover:bg-stone-700 text-stone-200"
            }`}
            title={isMuted ? "Activer le micro" : "Couper le micro"}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {callType === "video" && (
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-4 rounded-full transition-all cursor-pointer ${
                isVideoOff ? "bg-red-600 text-white" : "bg-stone-800 hover:bg-stone-700 text-stone-200"
              }`}
              title={isVideoOff ? "Activer la caméra" : "Couper la caméra"}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          <button
            onClick={closeCall}
            className="p-4 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
            title="Raccrocher"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

