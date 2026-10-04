"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Signal = { id: number; kind: string; payload: string | null };
type Status = "off" | "starting" | "waiting" | "connecting" | "connected" | "error";

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

const STATUS_TEXT: Record<Status, string> = {
  off: "Voix d\u00e9sactiv\u00e9e",
  starting: "Activation du micro\u2026",
  waiting: "En attente de votre conjoint(e)\u2026",
  connecting: "Connexion en cours\u2026",
  connected: "Connect\u00e9s : vous pouvez parler",
  error: "Voix indisponible",
};

export default function VoiceChat() {
  const [status, setStatus] = useState<Status>("off");
  const [muted, setMuted] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastIdRef = useRef(0);
  const busyRef = useRef(false);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  const send = useCallback(async (kind: string, payload: unknown) => {
    try {
      await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, payload: JSON.stringify(payload ?? null) }),
      });
    } catch {
      // le prochain echange reessaiera
    }
  }, []);

  const closePeer = useCallback(() => {
    const pc = pcRef.current;
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      pcRef.current = null;
    }
    pendingIceRef.current = [];
    if (audioRef.current) audioRef.current.srcObject = null;
  }, []);

  const flushIce = useCallback(async (pc: RTCPeerConnection) => {
    const queued = pendingIceRef.current;
    pendingIceRef.current = [];
    for (const c of queued) {
      try {
        await pc.addIceCandidate(c);
      } catch {
        // candidat ignore
      }
    }
  }, []);

  const createPc = useCallback(() => {
    closePeer();
    const pc = new RTCPeerConnection(ICE_CONFIG);
    const stream = streamRef.current;
    if (stream) stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.onicecandidate = (e) => {
      if (e.candidate) void send("ice", e.candidate.toJSON());
    };
    pc.ontrack = (e) => {
      if (audioRef.current) {
        audioRef.current.srcObject = e.streams[0];
        void audioRef.current.play().catch(() => {});
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setStatus("connected");
        setMsg(null);
      } else if (pc.connectionState === "disconnected") {
        setStatus("connecting");
      } else if (pc.connectionState === "failed") {
        setStatus("error");
        setMsg("Connexion vocale impossible sur ce r\u00e9seau. Essayez en Wi-Fi.");
      }
    };
    pcRef.current = pc;
    return pc;
  }, [closePeer, send]);

  const handle = useCallback(
    async (s: Signal, you: string) => {
      let data: unknown = null;
      try {
        data = s.payload ? JSON.parse(s.payload) : null;
      } catch {
        data = null;
      }

      if (s.kind === "join" && you === "partner1") {
        setStatus("connecting");
        const pc = createPc();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await send("offer", offer);
      } else if (s.kind === "offer" && you === "partner2" && data) {
        setStatus("connecting");
        const pc = createPc();
        await pc.setRemoteDescription(data as RTCSessionDescriptionInit);
        await flushIce(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await send("answer", answer);
      } else if (s.kind === "answer" && you === "partner1" && data) {
        const pc = pcRef.current;
        if (pc && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(data as RTCSessionDescriptionInit);
          await flushIce(pc);
        }
      } else if (s.kind === "ice" && data) {
        const pc = pcRef.current;
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(data as RTCIceCandidateInit);
          } catch {
            // candidat ignore
          }
        } else {
          pendingIceRef.current.push(data as RTCIceCandidateInit);
        }
      } else if (s.kind === "leave") {
        closePeer();
        setStatus("waiting");
      }
    },
    [createPc, closePeer, flushIce, send]
  );

  const poll = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const res = await fetch("/api/voice?since=" + lastIdRef.current, { cache: "no-store" });
      const d = await res.json().catch(() => null);
      if (!res.ok || !d?.success) return;
      for (const s of d.signals as Signal[]) {
        lastIdRef.current = Math.max(lastIdRef.current, s.id);
        try {
          await handle(s, String(d.you));
        } catch {
          // signal ignore
        }
      }
    } catch {
      // le prochain sondage reessaiera
    } finally {
      busyRef.current = false;
    }
  }, [handle]);

  const start = async () => {
    setMsg(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("error");
      setMsg("Micro non disponible sur ce navigateur.");
      return;
    }
    setStatus("starting");
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
    } catch {
      setStatus("error");
      setMsg("Autorisez le micro dans le navigateur pour activer la voix.");
      return;
    }
    try {
      await fetch("/api/voice", { method: "DELETE" });
    } catch {
      // nettoyage facultatif
    }
    lastIdRef.current = 0;
    await send("join", null);
    setStatus("waiting");
    pollRef.current = setInterval(poll, 1000);
    void poll();
  };

  const stop = async () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    closePeer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStatus("off");
    setMuted(false);
    setMsg(null);
    try {
      await fetch("/api/voice", { method: "DELETE" });
    } catch {
      // nettoyage facultatif
    }
    await send("leave", null);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !next;
      });
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      closePeer();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [closePeer]);

  const active = status !== "off" && status !== "error";
  const btn = { padding: "8px 14px", borderRadius: 12, border: 0, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" } as const;

  return (
    <div style={{ padding: 14, border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", display: "grid", gap: 8 }}>
      <audio ref={audioRef} autoPlay playsInline />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div>
          <strong style={{ fontSize: 14 }}>{"Voix avec votre conjoint(e)"}</strong>
          <div style={{ fontSize: 12, color: status === "connected" ? "#16a34a" : "#57534e" }}>{STATUS_TEXT[status]}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!active && (
            <button type="button" onClick={start} style={{ ...btn, background: "#C05638" }}>
              {"Activer la voix"}
            </button>
          )}
          {active && (
            <>
              <button type="button" onClick={toggleMute} style={{ ...btn, background: muted ? "#6b7280" : "#16a34a" }}>
                {muted ? "Micro coup\u00e9" : "Micro actif"}
              </button>
              <button type="button" onClick={stop} style={{ ...btn, background: "#dc2626" }}>
                {"Raccrocher"}
              </button>
            </>
          )}
        </div>
      </div>
      {msg && <p style={{ fontSize: 12, color: "#dc2626" }}>{msg}</p>}
      <p style={{ fontSize: 11, color: "#78716c" }}>
        {"Chacun doit appuyer sur \u00ab Activer la voix \u00bb. Utilisez un casque pour \u00e9viter l\u2019\u00e9cho."}
      </p>
    </div>
  );
}