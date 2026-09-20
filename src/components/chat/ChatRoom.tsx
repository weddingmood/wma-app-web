"use client";

import { useEffect, useState, useRef } from "react";
import { sendMessage } from "@/app/actions/message";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Message {
  id: number;
  coupleId: number;
  senderId: string;
  content: string;
  createdAt?: string | Date | null;
}

interface ChatRoomProps {
  coupleId: number;
  currentUserId: string;
  initialMessages: Message[];
}

export default function ChatRoom({ coupleId, currentUserId, initialMessages }: ChatRoomProps) {
  const [messageList, setMessageList] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView( { behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageList]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat_couple_${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessageList((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    const textToSend = content;
    setContent("");
    const result = await sendMessage({
      coupleId,
      senderId: currentUserId,
      content: textToSend,
    });

    if (!result.success) {
      console.error("Erreur d'envoi:", result.error);
      setContent(textToSend);
    }
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 bg-purple-50 rounded-t-lg">
        <h3 className="font-semibold text-purple-900">Discussion du Couple</h3>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messageList.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  isMe
                    ? "bg-purple-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />
        <button
          type="submit"
          disabled={isSending || !content.trim()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-md transition duration-150 disabled:opacity-50"
        >
          {isSending ? "Envoi..." : "Envoyer"}
        </button>
      </form>
    </div>
  );
}

