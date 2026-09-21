// Règles du Ludo en ligne, exécutées côté serveur.
// Le serveur lance le dé et vérifie chaque coup : un joueur ne peut ni jouer
// à la place de l'autre, ni choisir le résultat du dé, ni déplacer un pion
// qui n'a pas le droit de bouger.

import {
  executeLudoTokenMove,
  getMovableTokens,
  type LudoGameState,
} from "@/lib/ludo-engine";

export type LudoRuleResult =
  | { ok: true; state: LudoGameState }
  | { ok: false; message: string; status: number };

function refuse(message: string, status: number): LudoRuleResult {
  return { ok: false, message, status };
}

export function isPlayersTurn(state: LudoGameState, partner: string): boolean {
  const active = state.players[state.activePlayerIndex];
  return !!active && active.id === partner;
}

/** Applique un lancer de dé (règles Ludo King) : 3 six d'affilée = tour perdu. */
export function applyLudoRoll(state: LudoGameState, rolled: number): LudoGameState {
  const active = state.players[state.activePlayerIndex];
  const nextIdx = (state.activePlayerIndex + 1) % state.players.length;
  const next = state.players[nextIdx];
  const sixes = rolled === 6 ? state.consecutiveSixes + 1 : 0;

  if (sixes >= 3) {
    return {
      ...state,
      diceValue: rolled,
      diceRolled: true,
      consecutiveSixes: 0,
      bonusRoll: false,
      canRoll: true,
      movableTokenIds: [],
      activePlayerIndex: nextIdx,
      lastMessage:
        "3 six consécutifs ! " + active.name + " passe son tour. Au tour de " + next.name + ".",
    };
  }

  const movable = getMovableTokens(active, rolled);

  if (movable.length === 0) {
    return {
      ...state,
      diceValue: rolled,
      diceRolled: true,
      consecutiveSixes: 0,
      bonusRoll: false,
      canRoll: true,
      movableTokenIds: [],
      activePlayerIndex: nextIdx,
      lastMessage:
        active.name + " a obtenu un " + rolled + ". Aucun pion ne peut bouger. Au tour de " + next.name + ".",
    };
  }

  return {
    ...state,
    diceValue: rolled,
    diceRolled: true,
    consecutiveSixes: sixes,
    canRoll: false,
    movableTokenIds: movable,
    lastMessage: active.name + " a obtenu un " + rolled + " ! Choisissez le pion à déplacer.",
  };
}

export function rollForPlayer(
  state: LudoGameState,
  partner: string,
  rolled: number
): LudoRuleResult {
  if (state.status === "finished") return refuse("La partie est terminée.", 409);
  if (!isPlayersTurn(state, partner)) return refuse("Ce n'est pas votre tour.", 403);
  if (!state.canRoll) return refuse("Déplacez d'abord un pion.", 409);
  if (!Number.isInteger(rolled) || rolled < 1 || rolled > 6) {
    return refuse("Lancer invalide.", 400);
  }
  return { ok: true, state: applyLudoRoll(state, rolled) };
}

export function moveForPlayer(
  state: LudoGameState,
  partner: string,
  tokenId: number
): LudoRuleResult {
  if (state.status === "finished") return refuse("La partie est terminée.", 409);
  if (!isPlayersTurn(state, partner)) return refuse("Ce n'est pas votre tour.", 403);
  if (state.canRoll || !state.diceRolled || !state.diceValue) {
    return refuse("Lancez d'abord le dé.", 409);
  }
  if (!Number.isInteger(tokenId) || !state.movableTokenIds.includes(tokenId)) {
    return refuse("Ce pion ne peut pas bouger.", 400);
  }
  return { ok: true, state: executeLudoTokenMove(state, tokenId).nextState };
}
