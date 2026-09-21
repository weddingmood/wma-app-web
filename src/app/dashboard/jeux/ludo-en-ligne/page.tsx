"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { LudoGameState, LudoToken } from "@/lib/ludo-engine";

interface OnlineView {
  success: boolean;
  changed?: boolean;
  you: string;
  version: string;
  status?: string;
  game?: LudoGameState;
  message?: string;
}

const COLOR_LABEL: Record<string, string> = {
  terracotta: "Terracotta",
  gold: "Or",
  emerald: "Émeraude",
  ivory: "Ivoire",
};

const COLOR_CHIP: Record<string, string> = {
  terracotta: "bg-[#C05638]",
  gold: "bg-[#D4AF37]",
  emerald: "bg-emerald-700",
  ivory: "bg-stone-300",
};

function tokenLabel(t: LudoToken) {
  if (t.state === "yard") return "à l'écurie";
  if (t.state === "goal") return "à l'autel ♥";
  if (t.state === "home_stretch") return "allée finale " + t.homeStep + "/6";
  return "case " + (t.trackPos + 1);
}

export default function LudoEnLignePage() {
  const [view, setView] = useState<OnlineView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const versionRef = useRef<string | null>(null);

  const apply = useCallback((data: OnlineView) => {
    if (data.game) {
      versionRef.current = data.version;
      setView(data);
    }
  }, []);

  const poll = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    try {
      const url =
        "/api/games/ludo" +
        (versionRef.current ? "?since=" + encodeURIComponent(versionRef.current) : "");
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (res.status === 401) {
        setError("Connectez-vous à votre espace pour jouer.");
        return;
      }
      if (data.success && data.changed !== false) apply(data);
      setError("");
    } catch {
      setError("Connexion perdue, nouvelle tentative...");
    }
  }, [apply]);

  useEffect(() => {
    poll();
    const timer = setInterval(poll, 2000);
    return () => clearInterval(timer);
  }, [poll]);

  const send = async (payload: Record<string, unknown>) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/games/ludo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        apply(data);
        setError("");
      } else {
        setError(data.message || "Action refusée.");
        poll();
      }
    } catch {
      setError("Connexion perdue. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const game = view?.game;
  if (!view || !game) {
    return (
      <p className="text-center text-sm text-stone-500 py-16 animate-pulse">
        {error || "Chargement de la partie..."}
      </p>
    );
  }

  const active = game.players[game.activePlayerIndex];
  const me = game.players.find((p) => p.id === view.you);
  const finished = game.status === "finished";
  const myTurn = !finished && active?.id === view.you;
  const winner = game.players.find((p) => p.color === game.winner);

  return (
    <div className="max-w-md mx-auto space-y-4 pb-16 px-1">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Ludo en ligne</h1>
        <p className="text-xs text-stone-500 leading-relaxed">
          Version d'essai : ouvrez cette page sur les deux téléphones, chacun avec son
          propre partenaire actif. Le dé est lancé par le serveur et chaque coup est vérifié.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        {me && (
          <p className="text-xs text-stone-500">
            Vous jouez :{" "}
            <strong className="text-stone-900">{me.name}</strong>{" "}
            <span
              className={"inline-block w-2.5 h-2.5 rounded-full align-middle " + COLOR_CHIP[me.color]}
            />{" "}
            {COLOR_LABEL[me.color]}
          </p>
        )}

        <p className="text-sm font-bold text-stone-900">
          {finished
            ? "Victoire de " + (winner ? winner.name : "?") + " ♥"
            : myTurn
            ? "À vous de jouer"
            : "Au tour de " + active?.name}
        </p>
        <p className="text-xs text-stone-600">{game.lastMessage}</p>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center text-3xl font-black text-amber-600 tabular-nums">
            {game.diceValue ?? "–"}
          </div>
          <button
            onClick={() => send({ action: "roll" })}
            disabled={!myTurn || !game.canRoll || busy}
            className="flex-1 py-3 rounded-xl bg-amber-700 text-white text-sm font-semibold disabled:opacity-40 hover:bg-amber-800 transition"
          >
            Lancer le dé
          </button>
        </div>

        {myTurn && !game.canRoll && game.diceRolled && game.movableTokenIds.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-semibold text-stone-500 uppercase">
              Quel pion déplacer ?
            </p>
            {game.movableTokenIds.map((id) => {
              const token = active.tokens.find((t) => t.id === id);
              return (
                <button
                  key={id}
                  onClick={() => send({ action: "move", tokenId: id })}
                  disabled={busy}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-xs font-semibold text-stone-800 hover:bg-amber-100 disabled:opacity-50"
                >
                  Pion {id + 1} {token ? "(" + tokenLabel(token) + ")" : ""}
                </button>
              );
            })}
          </div>
        )}

        {finished && (
          <button
            onClick={() => send({ action: "new" })}
            disabled={busy}
            className="w-full py-3 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50"
          >
            Nouvelle partie
          </button>
        )}
      </div>

      <div className="space-y-3">
        {game.players.map((p) => (
          <div
            key={p.id}
            className={
              "p-3 rounded-2xl border bg-white " +
              (p.id === active?.id && !finished ? "border-amber-300" : "border-stone-200")
            }
          >
            <p className="text-xs font-bold text-stone-900 flex items-center gap-2">
              <span className={"inline-block w-2.5 h-2.5 rounded-full " + COLOR_CHIP[p.color]} />
              {p.name} · {p.tokensAtGoal}/4 à l'autel
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-1.5">
              {p.tokens.map((t) => (
                <li
                  key={t.id}
                  className="text-[11px] text-stone-600 bg-stone-50 rounded-lg px-2 py-1"
                >
                  Pion {t.id + 1} : {tokenLabel(t)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {!finished && (
        <button
          onClick={() => {
            if (window.confirm("Recommencer une nouvelle partie et abandonner celle-ci ?")) {
              send({ action: "new", force: true });
            }
          }}
          className="text-[11px] text-stone-400 underline"
        >
          Recommencer la partie
        </button>
      )}
    </div>
  );
}
