"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AudioExplainer from "@/components/AudioExplainer";
import { LESSONS, STEPS, lessonById } from "@/lib/tour-content";
import { OFFICIAL_WHATSAPP_URL } from "@/lib/constants";

type Status = "none" | "in_progress" | "completed" | "skipped";
type Rect = { top: number; left: number; width: number; height: number };

const TOTAL = STEPS.length;

function persist(patch: { status?: Status; step?: number; audio?: boolean }) {
  try {
    fetch("/api/tour", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).catch(() => {});
  } catch {}
}

function findTarget(selectors?: string[]): HTMLElement | null {
  if (!selectors) return null;
  for (const s of selectors) {
    try {
      const el = document.querySelector(s) as HTMLElement | null;
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight) return el;
    } catch {}
  }
  return null;
}

const dock: React.CSSProperties = {
  position: "fixed", left: 12, right: 12, bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
  marginLeft: "auto", maxWidth: 420, zIndex: 60,
};
const card: React.CSSProperties = {
  background: "var(--wm-surface-pure, #fff)", border: "1px solid var(--wm-accent-gold, #D4AF37)", borderRadius: 18,
  boxShadow: "0 10px 30px rgba(0,0,0,0.16)", padding: 14, display: "grid", gap: 10, maxHeight: "72vh", overflowY: "auto",
};
const btn = (primary: boolean): React.CSSProperties => ({
  padding: "10px 14px", borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: "pointer",
  border: primary ? "0" : "1px solid var(--wm-border, #d6d3d1)",
  background: primary ? "var(--wm-primary, #C05638)" : "var(--wm-surface-pure, #fff)",
  color: primary ? "#fff" : "inherit",
});

function Demo({ kind }: { kind: "budget" | "tasks" }) {
  const box: React.CSSProperties = { padding: 10, borderRadius: 12, background: "var(--wm-surface-ivory, #FCFAF7)", border: "1px dashed var(--wm-border, #d6d3d1)", fontSize: 12, display: "grid", gap: 6 };
  if (kind === "budget") {
    return (
      <div style={box}>
        <strong>{"Exemple fictif : il ne modifie pas votre compte"}</strong>
        <span>{"Budget total : 1 000 000 F"}</span>
        <div style={{ height: 8, borderRadius: 999, background: "var(--wm-line, #e7e5e4)" }}>
          <div style={{ width: "25%", height: 8, borderRadius: 999, background: "var(--wm-primary, #C05638)" }} />
        </div>
        <span>{"D\u00e9pens\u00e9 : 250 000 F, reste : 750 000 F"}</span>
      </div>
    );
  }
  return (
    <div style={box}>
      <strong>{"Exemple fictif : il ne modifie pas votre compte"}</strong>
      <span>{"R\u00e9server la salle : \u00e0 faire"}</span>
      <span>{"Choisir le traiteur : en cours"}</span>
      <span>{"Fixer la date : termin\u00e9"}</span>
    </div>
  );
}

export default function DiscoveryTour() {
  const pathname = usePathname();
  const router = useRouter();
  const onDash = !!pathname && pathname.startsWith("/dashboard");
  const [loaded, setLoaded] = useState(false);
  const [auth, setAuth] = useState(false);
  const [status, setStatus] = useState<Status>("none");
  const [step, setStep] = useState(0);
  const [audioOn, setAudioOn] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [extraId, setExtraId] = useState<string | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onDash) {
      setLoaded(false); setAuth(false); setTourOpen(false); setMenuOpen(false); setLessonId(null); setRect(null);
      return;
    }
    if (loaded) return;
    fetch("/api/tour", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.success) {
          setAuth(true);
          setStatus(d.status as Status);
          setStep(Math.min(Math.max(Number(d.step) || 0, 0), TOTAL - 1));
          setAudioOn(d.audio !== false);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [onDash, loaded]);

  useEffect(() => {
    if (!tourOpen) { setRect(null); return; }
    const st = STEPS[step];
    let scrolled = false;
    const update = () => {
      const el = findTarget(st.target);
      if (!el) { setRect((p) => (p === null ? p : null)); return; }
      if (!scrolled) { scrolled = true; try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {} }
      const r = el.getBoundingClientRect();
      setRect((p) => (p && Math.abs(p.top - r.top) < 1 && Math.abs(p.left - r.left) < 1 && Math.abs(p.width - r.width) < 1 && Math.abs(p.height - r.height) < 1 ? p : { top: r.top, left: r.left, width: r.width, height: r.height }));
    };
    update();
    const t = window.setInterval(update, 400);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.clearInterval(t); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [tourOpen, step, pathname]);

  useEffect(() => {
    if (tourOpen && panelRef.current) { try { panelRef.current.focus({ preventScroll: true }); } catch {} }
  }, [tourOpen, step]);

  const begin = useCallback((at: number) => {
    setStatus("in_progress"); setStep(at); setTourOpen(true); setMenuOpen(false); setLessonId(null); setExtraId(null);
    persist({ status: "in_progress", step: at });
  }, []);

  const closeTour = useCallback(() => {
    setTourOpen(false); setExtraId(null);
    persist({ status: status === "completed" ? "completed" : "in_progress", step });
  }, [status, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (tourOpen) closeTour();
      else if (lessonId) setLessonId(null);
      else if (menuOpen) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourOpen, lessonId, menuOpen, closeTour]);

  if (!onDash || !auth) return null;

  const go = (n: number) => {
    const s = Math.min(Math.max(n, 0), TOTAL - 1);
    setStep(s); setExtraId(null);
    persist({ status: "in_progress", step: s });
  };
  const finish = () => {
    setStatus("completed"); setTourOpen(false); setExtraId(null);
    persist({ status: "completed", step: TOTAL - 1 });
  };
  const chooseFree = () => { setStatus("skipped"); persist({ status: "skipped" }); };
  const toggleAudio = (v: boolean) => { setAudioOn(v); persist({ audio: v }); };

  const st = STEPS[step];
  const lesson = lessonById(extraId || st.lesson);
  const last = step === TOTAL - 1;
  const choiceVisible = status === "none";
  const resumeAvailable = status === "in_progress" && step > 0;
  const startLabel = resumeAvailable ? "Recommencer la d\u00e9couverte" : "D\u00e9couvrir Wedding Mood";

  return (
    <>
      {tourOpen && rect && (
        <div aria-hidden="true" style={{ position: "fixed", top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8, border: "3px solid var(--wm-accent-gold, #D4AF37)", borderRadius: 12, pointerEvents: "none", zIndex: 55 }} />
      )}

      {choiceVisible && (
        <div role="dialog" aria-modal="true" aria-labelledby="wm-choice-title" style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.35)", display: "grid", placeItems: "center", padding: 16 }}>
          <div style={{ ...card, maxWidth: 420, width: "100%", textAlign: "center" }}>
            <h2 id="wm-choice-title" style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{"Bienvenue dans Wedding Mood"}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{"Voulez-vous une visite guid\u00e9e de quelques minutes, avec des explications \u00e9crites et audio facultatives ?"}</p>
            <button type="button" data-track="tour_start" onClick={() => begin(0)} style={btn(true)}>{"D\u00e9couvrir Wedding Mood"}</button>
            <button type="button" data-track="tour_skip" onClick={chooseFree} style={btn(false)}>{"Utiliser l'application librement"}</button>
            <p style={{ fontSize: 12, margin: 0, color: "var(--wm-text-faint, #78716c)" }}>{"Vous pourrez toujours lancer la visite avec le bouton ? en bas de l'\u00e9cran."}</p>
          </div>
        </div>
      )}

      {tourOpen && (
        <div style={dock}>
          <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="wm-tour-title" style={{ ...card, outline: "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span aria-live="polite" style={{ fontSize: 12, fontWeight: 800, color: "var(--wm-primary, #C05638)" }}>{"\u00c9tape " + (step + 1) + " sur " + TOTAL}</span>
              <button type="button" onClick={closeTour} aria-label="Fermer la visite (vous pourrez la reprendre)" style={{ border: 0, background: "transparent", fontSize: 20, lineHeight: 1, cursor: "pointer" }}>{"\u00d7"}</button>
            </div>
            <div aria-hidden="true" style={{ display: "flex", gap: 3 }}>
              {STEPS.map((s, i) => (<span key={s.id} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? "var(--wm-primary, #C05638)" : "var(--wm-line, #e7e5e4)" }} />))}
            </div>
            <h2 id="wm-tour-title" style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{st.title}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{st.body}</p>
            {st.target && !rect && (
              <p style={{ fontSize: 12, margin: 0, color: "var(--wm-text-faint, #78716c)" }}>{"Cette rubrique n'est pas visible sur votre \u00e9cran : ouvrez le menu si besoin."}</p>
            )}
            {st.demo && <Demo kind={st.demo} />}
            {st.goto && (
              <button type="button" onClick={() => { const path = st.goto ? st.goto.path : "/dashboard"; router.push(path); }} style={btn(false)}>{st.goto.label}</button>
            )}
            {audioOn && lesson && (
              <div style={{ display: "grid", gap: 8 }}>
                <AudioExplainer key={lesson.id} id={lesson.id} title={lesson.title} text={lesson.text} audioSrc={lesson.audioSrc} />
                {st.extra && st.extra.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", fontSize: 12 }}>
                    <span>{"\u00c9couter aussi :"}</span>
                    {[st.lesson, ...st.extra].map((id) => {
                      const l = lessonById(id);
                      if (!l) return null;
                      const current = (extraId || st.lesson) === id;
                      return (
                        <button key={id} type="button" onClick={() => setExtraId(id === st.lesson ? null : id)} aria-pressed={current} style={{ padding: "5px 9px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: "1px solid var(--wm-border, #d6d3d1)", background: current ? "var(--wm-accent-gold-light, #F7EFD2)" : "var(--wm-surface-pure, #fff)" }}>{l.title}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <input type="checkbox" checked={audioOn} onChange={(e) => toggleAudio(e.target.checked)} />
              {"Afficher le lecteur audio"}
            </label>
            {last ? (
              <div style={{ display: "grid", gap: 8 }}>
                <button type="button" data-track="tour_done" onClick={() => { finish(); router.push("/dashboard/tasks"); }} style={btn(true)}>{"Commencer mes pr\u00e9paratifs"}</button>
                <button type="button" onClick={() => begin(0)} style={btn(false)}>{"Revoir le tutoriel"}</button>
                <button type="button" onClick={() => { finish(); router.push("/dashboard"); }} style={btn(false)}>{"Retour au tableau de bord"}</button>
                <button type="button" onClick={() => go(step - 1)} style={{ ...btn(false), border: 0 }}>{"Pr\u00e9c\u00e9dent"}</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                <button type="button" onClick={() => go(step - 1)} disabled={step === 0} style={{ ...btn(false), opacity: step === 0 ? 0.5 : 1 }}>{"Pr\u00e9c\u00e9dent"}</button>
                <button type="button" onClick={() => go(step + 1)} style={btn(true)}>{"Suivant"}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {lessonId && !tourOpen && (() => {
        const l = lessonById(lessonId);
        if (!l) return null;
        return (
          <div style={dock}>
            <div role="dialog" aria-modal="false" aria-label={l.title} style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{l.title}</h2>
                <button type="button" onClick={() => setLessonId(null)} aria-label="Fermer" style={{ border: 0, background: "transparent", fontSize: 20, lineHeight: 1, cursor: "pointer" }}>{"\u00d7"}</button>
              </div>
              <AudioExplainer key={l.id} id={l.id} title={l.title} text={l.text} audioSrc={l.audioSrc} />
            </div>
          </div>
        );
      })()}

      {!tourOpen && !lessonId && !choiceVisible && (
        <>
          {menuOpen && (
            <div role="menu" aria-label="Aide" style={{ position: "fixed", right: 14, bottom: "calc(70px + env(safe-area-inset-bottom, 0px))", zIndex: 60, width: "min(300px, calc(100vw - 28px))", maxHeight: "65vh", overflowY: "auto", ...card }}>
              <strong style={{ fontSize: 14 }}>{"Aide"}</strong>
              <button type="button" role="menuitem" onClick={() => begin(0)} style={btn(true)}>{startLabel}</button>
              {resumeAvailable && (
                <button type="button" role="menuitem" onClick={() => begin(step)} style={btn(false)}>{"Reprendre la d\u00e9couverte (\u00e9tape " + (step + 1) + " sur " + TOTAL + ")"}</button>
              )}
              <strong style={{ fontSize: 13, marginTop: 4 }}>{"Explications audio"}</strong>
              {LESSONS.map((l) => (
                <button key={l.id} type="button" role="menuitem" onClick={() => { setLessonId(l.id); setMenuOpen(false); }} style={{ ...btn(false), textAlign: "left", fontWeight: 600 }}>{l.title}</button>
              ))}
              <a href={OFFICIAL_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" role="menuitem" style={{ ...btn(false), textAlign: "center", textDecoration: "none", display: "block" }}>{"Contacter l'assistance sur WhatsApp"}</a>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Aide et visite guid\u00e9e"
            aria-expanded={menuOpen}
            style={{ position: "fixed", right: 14, bottom: "calc(14px + env(safe-area-inset-bottom, 0px))", zIndex: 60, width: 48, height: 48, borderRadius: 999, border: 0, background: "var(--wm-primary, #C05638)", color: "#fff", fontSize: 22, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 18px rgba(0,0,0,0.2)" }}
          >
            {"?"}
          </button>
        </>
      )}
    </>
  );
}