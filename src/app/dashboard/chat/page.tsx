"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  Phone,
  Video,
  Send,
  Heart,
  CheckCheck,
  WifiOff,
} from "lucide-react";

export default function ChatPage() {
  const { couple, activePartner, startCall, activeTheme, syncState } = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const otherPartnerName =
    activePartner === "partner1"
      ? couple?.partner2Name || "Épouse (Fiancée)"
      : couple?.partner1Name || "Époux (Fiancé)";

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages || []);
        }
      }
    } catch {
      // mode hors connexion
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [activePartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const textToSend = input.trim();
    setInput("");

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      senderId: activePartner,
      text: textToSend,
      isRead: false,
      sentOffline: syncState === "Hors connexion",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSend,
          sentOffline: syncState === "Hors connexion",
          localId: tempId,
        }),
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch {
      // conserve le message localement
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto rounded-3xl glass-panel border border-stone-200 shadow-sm overflow-hidden">
      
      {/* Chat Header */}
      <div className="p-4 sm:p-5 bg-white/80 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#C05638] text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs" style={{ backgroundColor: activeTheme.primary }}>
              {otherPartnerName.charAt(0)}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
          </div>

          <div>
            <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
              {otherPartnerName}
            </h3>
            <span className="text-[11px] text-stone-500">
              Espace Intime Privé : {syncState}
            </span>
          </div>
        </div>

        {/* Audio & Video Call Quick Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => startCall("audio")}
            className="p-2.5 rounded-xl bg-white/80 hover:bg-white text-stone-700 transition-colors cursor-pointer border border-stone-200"
            title="Lancer un appel audio"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => startCall("video")}
            className="p-2.5 rounded-xl bg-white/80 hover:bg-white text-stone-700 transition-colors cursor-pointer border border-stone-200"
            title="Lancer un appel vidéo"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#FAF8F5]/80">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
            <Heart className="w-10 h-10 text-[#C05638]" />
            <h4 className="font-serif font-bold text-stone-800 text-base">Votre sanctuaire de messages</h4>
            <p className="text-xs text-stone-500 max-w-xs">
              Écrivez à votre fiancé(e). Les messages sont protégés et conservés même sans connexion active.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderId === activePartner;
            return (
              <div
                key={m.id || idx}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[78%] sm:max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                    isMe
                      ? "bg-[#C05638] text-white rounded-br-xs"
                      : "bg-white text-stone-900 border border-stone-200 rounded-bl-xs"
                  }`}
                  style={isMe ? { backgroundColor: activeTheme.primary } : {}}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  
                  <div
                    className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                      isMe ? "text-white/80" : "text-stone-400"
                    }`}
                  >
                    <span>
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                    {isMe && (
                      m.sentOffline ? (
                        <WifiOff className="w-2.5 h-2.5" />
                      ) : (
                        <CheckCheck className="w-3 h-3" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white/90 border-t border-stone-200 flex items-center gap-2">
        <input
          type="text"
          placeholder={`Écrire un message à ${otherPartnerName.split(" ")[0]}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-400"
        />

        <button
          type="submit"
          disabled={!input.trim()}
          className="p-3 rounded-2xl bg-[#C05638] text-white disabled:opacity-40 hover:bg-[#A84429] transition-all shadow-xs shrink-0 cursor-pointer"
          style={{ backgroundColor: activeTheme.primary }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}

