"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PlayState = "idle" | "loading" | "playing" | "paused" | "error";

let activeStop: (() => void) | null = null;
const fileCache = new Map<string, boolean>();

function splitSentences(text: string): string[] {
  const parts = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]*/g) || [text];
  return parts.map((s) => s.trim()).filter(Boolean);
}

function pickVoice(): SpeechSynthesisVoice | null {
  try {
    const vs = window.speechSynthesis.getVoices();
    return vs.find((v) => v.lang === "fr-FR") || vs.find((v) => v.lang.toLowerCase().startsWith("fr")) || null;
  } catch {
    return null;
  }
}

async function probeFile(src: string): Promise<boolean> {
  if (fileCache.has(src)) return fileCache.get(src) as boolean;
  try {
    const r = await fetch(src, { method: "HEAD", cache: "no-store" });
    const ok = r.ok && (r.headers.get("content-type") || "").startsWith("audio");
    fileCache.set(src, ok);
    return ok;
  } catch {
    fileCache.set(src, false);
    return false;
  }
}

export default function AudioExplainer({ id, title, text, audioSrc }: { id: string; title: string; text: string; audioSrc?: string }) {
  const sentences = useMemo(() => splitSentences(text), [text]);
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState<PlayState>("idle");
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"file" | "voice" | null>(null);
  const run = useRef(0);
  const idx = useRef(0);
  const vol = useRef(1);
  const stateRef = useRef<PlayState>("idle");
  stateRef.current = state;
  const audioEl = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const stopSelf = useRef<() => void>(() => {});

  const halt = useCallback((reset: boolean) => {
    run.current += 1;
    try { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); } catch {}
    const a = audioEl.current;
    if (a) {
      try { a.pause(); if (reset) a.currentTime = 0; } catch {}
    }
    if (reset) {
      idx.current = 0;
      setProgress(0);
      setState("idle");
    }
  }, []);
  stopSelf.current = () => halt(true);

  useEffect(() => {
    const hasVoice = "speechSynthesis" in window;
    setSupported(hasVoice || !!audioSrc);
    if (hasVoice) {
      const s = window.speechSynthesis;
      const sync = () => { voiceRef.current = pickVoice(); };
      sync();
      s.onvoiceschanged = sync;
    }
    if (audioSrc) { void probeFile(audioSrc); }
    return () => {
      run.current += 1;
      try { if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); window.speechSynthesis.onvoiceschanged = null; } } catch {}
      const a = audioEl.current;
      if (a) { try { a.pause(); } catch {} }
      if (activeStop === stopSelf.current) activeStop = null;
    };
  }, [audioSrc]);

  const speakFrom = useCallback((start: number) => {
    const synth = window.speechSynthesis;
    run.current += 1;
    const my = run.current;
    synth.cancel();
    setMode("voice");
    setMessage(voiceRef.current ? null : "Aucune voix fran\u00e7aise d\u00e9tect\u00e9e sur cet appareil : la qualit\u00e9 peut varier. Vous pouvez lire la transcription.");
    setState("loading");
    const guard = window.setTimeout(() => {
      if (my === run.current && stateRef.current === "loading") {
        setState("error");
        setMessage("La lecture ne d\u00e9marre pas sur cet appareil. Lisez la transcription ci-dessous.");
      }
    }, 5000);
    const next = (k: number) => {
      if (my !== run.current) return;
      if (k >= sentences.length) {
        window.clearTimeout(guard);
        idx.current = 0;
        setProgress(100);
        setState("idle");
        return;
      }
      idx.current = k;
      setProgress(Math.round((k / sentences.length) * 100));
      const u = new SpeechSynthesisUtterance(sentences[k]);
      u.lang = "fr-FR";
      if (voiceRef.current) u.voice = voiceRef.current;
      u.volume = vol.current;
      u.rate = 0.95;
      u.onstart = () => { if (my === run.current) setState("playing"); };
      u.onend = () => next(k + 1);
      u.onerror = (e) => {
        if (my !== run.current) return;
        const err = (e as SpeechSynthesisErrorEvent).error;
        if (err === "interrupted" || err === "canceled") return;
        window.clearTimeout(guard);
        setState("error");
        setMessage("La lecture audio a \u00e9chou\u00e9 sur cet appareil. Lisez la transcription ci-dessous.");
      };
      synth.speak(u);
    };
    window.setTimeout(() => next(start), 60);
  }, [sentences]);

  const startFile = () => {
    const src = audioSrc as string;
    setMode("file");
    setState("loading");
    let a = audioEl.current;
    if (!a) {
      a = new Audio();
      audioEl.current = a;
    }
    const el = a;
    el.preload = "auto";
    el.src = src;
    el.volume = vol.current;
    el.ontimeupdate = () => setProgress(el.duration ? Math.round((el.currentTime / el.duration) * 100) : 0);
    el.onplaying = () => setState("playing");
    el.onpause = () => { if (!el.ended && stateRef.current === "playing") setState("paused"); };
    el.onended = () => { setState("idle"); setProgress(100); };
    el.onerror = () => {
      fileCache.set(src, false);
      audioEl.current = null;
      if ("speechSynthesis" in window) {
        setMessage("Fichier audio indisponible : lecture par la voix de l'appareil.");
        speakFrom(0);
      } else {
        setState("error");
        setMessage("Le fichier audio est indisponible. Lisez la transcription ci-dessous.");
      }
    };
    el.play().catch(() => {
      setState("error");
      setMessage("Lecture impossible. Appuyez de nouveau sur \u00ab \u00c9couter \u00bb.");
    });
  };

  const play = () => {
    setMessage(null);
    if (activeStop && activeStop !== stopSelf.current) activeStop();
    activeStop = stopSelf.current;
    if (audioSrc && fileCache.get(audioSrc) === true) { startFile(); return; }
    if (!("speechSynthesis" in window)) {
      setState("error");
      setMessage("La lecture audio n'est pas disponible sur cet appareil. Lisez la transcription ci-dessous.");
      return;
    }
    speakFrom(0);
  };

  const pause = () => {
    if (mode === "file") { audioEl.current?.pause(); setState("paused"); return; }
    run.current += 1;
    try { window.speechSynthesis.cancel(); } catch {}
    setState("paused");
  };

  const resume = () => {
    if (activeStop && activeStop !== stopSelf.current) activeStop();
    activeStop = stopSelf.current;
    if (mode === "file") { audioEl.current?.play().catch(() => {}); setState("playing"); return; }
    speakFrom(idx.current);
  };

  const replay = () => { halt(true); play(); };

  const changeVolume = (v: number) => {
    vol.current = v;
    setVolume(v);
    if (audioEl.current) audioEl.current.volume = v;
  };

  const btn = (primary: boolean): React.CSSProperties => ({
    padding: "10px 14px", borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: "pointer",
    border: primary ? "0" : "1px solid var(--wm-border, #d6d3d1)",
    background: primary ? "var(--wm-primary, #C05638)" : "var(--wm-surface-pure, #fff)",
    color: primary ? "#fff" : "inherit",
  });

  const busy = state === "playing" || state === "loading";

  return (
    <div id={"wm-audio-" + id} role="group" aria-label={"Explication audio : " + title} style={{ display: "grid", gap: 8 }}>
      {supported && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {state === "idle" || state === "error" ? (
            <button type="button" onClick={play} style={btn(true)}>{progress >= 100 ? "R\u00e9\u00e9couter" : "\u00c9couter les explications"}</button>
          ) : busy ? (
            <button type="button" onClick={pause} disabled={state === "loading"} style={btn(true)}>{"Pause"}</button>
          ) : (
            <button type="button" onClick={resume} style={btn(true)}>{"Reprendre"}</button>
          )}
          {state !== "idle" && <button type="button" onClick={() => halt(true)} style={btn(false)}>{"Arr\u00eater"}</button>}
          {state !== "idle" && state !== "error" && <button type="button" onClick={replay} style={btn(false)}>{"Depuis le d\u00e9but"}</button>}
        </div>
      )}
      {supported && (
        <>
          <div role="progressbar" aria-label="Progression de la lecture" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} style={{ height: 6, borderRadius: 999, background: "var(--wm-line, #e7e5e4)" }}>
            <div style={{ width: progress + "%", height: 6, borderRadius: 999, background: "var(--wm-primary, #C05638)", transition: "width .3s" }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            {"Volume"}
            <input type="range" min={0} max={1} step={0.1} value={volume} onChange={(e) => changeVolume(Number(e.target.value))} aria-label="Volume" style={{ flex: 1 }} />
          </label>
        </>
      )}
      {state === "loading" && <p aria-live="polite" style={{ fontSize: 12, margin: 0 }}>{"Chargement de l'audio..."}</p>}
      {!supported && <p style={{ fontSize: 12, margin: 0 }}>{"La lecture audio n'est pas disponible sur cet appareil. Lisez la transcription ci-dessous."}</p>}
      {message && <p role="status" style={{ fontSize: 12, margin: 0, color: "#b45309" }}>{message}</p>}
      <details {...(supported ? {} : { open: true })}>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{"Lire la transcription"}</summary>
        <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>{text}</p>
      </details>
    </div>
  );
}