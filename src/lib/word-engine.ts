// Défi des Mots / Mots en Couple engine for Wedding Mood
// Follows Scrabble game rules: 11x11 board, tile rack, multipliers (DL, TL, DM, TM),
// comprehensive French vocabulary dictionary, word verification & AI opponent

export type MultiplierType = "normal" | "dl" | "tl" | "dm" | "tm" | "center";

export interface BoardCell {
  row: number;
  col: number;
  multiplier: MultiplierType;
  letter: string | null;
  points: number;
  isLocked: boolean; // locked from previous turns
  player?: "partner1" | "partner2";
}

export interface LetterTile {
  id: string;
  letter: string;
  points: number;
}

export interface PlacedTile {
  row: number;
  col: number;
  letter: string;
  points: number;
  tileId: string;
}

export interface WordMoveResult {
  isValid: boolean;
  score: number;
  wordsFormed: string[];
  error?: string;
}

export interface WordGameState {
  board: BoardCell[][]; // 11x11
  bag: LetterTile[];
  rack1: LetterTile[];
  rack2: LetterTile[];
  score1: number;
  score2: number;
  turn: "partner1" | "partner2";
  status: "ongoing" | "finished";
  winner: "partner1" | "partner2" | "draw" | null;
  gameMode: "couple" | "ai" | "daily" | "training";
  dailyChallenge?: {
    date: string;
    letters: string[];
    bestWord: string;
    targetScore: number;
  };
  history: {
    turnNumber: number;
    player: "partner1" | "partner2";
    word: string;
    score: number;
  }[];
  lastMessage: string;
}

export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1,
  J: 8, K: 10, L: 1, M: 2, N: 1, O: 1, P: 3, Q: 8, R: 1,
  S: 1, T: 1, U: 1, V: 4, W: 10, X: 10, Y: 10, Z: 10,
};

// French distribution of letter bag (approx 70 tiles for compact 11x11 game)
export const TILE_DISTRIBUTION: Record<string, number> = {
  E: 9, A: 6, I: 5, N: 4, O: 4, R: 4, S: 4, T: 4, U: 4, L: 3,
  D: 2, M: 2, P: 2, B: 1, C: 2, F: 1, G: 1, H: 1, V: 1,
  J: 1, Q: 1, K: 1, W: 1, X: 1, Y: 1, Z: 1,
};

import { COMPREHENSIVE_FRENCH_DICTIONARY } from "@/lib/french-lexicon";

// Built-in French lexicon containing thousands of common, conjugation and wedding vocabulary words
const FRENCH_LEXICON_WORDS = [
  // Mariage & Couple & Spiritualité
  "ALLIANCE", "AMOUR", "BAGUE", "NOUPTIAL", "NUPTIAL", "BENEDICTION", "COUPLE", "FOYER", "MARIAGE",
  "EPOUX", "EPOUSE", "MARI", "FEMME", "PRIERE", "PASTEUR", "EGLISE", "CATHEDRALE", "TEMOIN", "AUTEL",
  "ENGAGEMENT", "VOEU", "VOEUX", "PROMESSE", "FIDELITE", "TENDRESSE", "GRACE", "SAINT", "FOI",
  "ESPERANCE", "JOIE", "PAIX", "DOT", "FAMILLE", "FÊTE", "FETE", "BANQUET", "RECEPTION", "CORTÈGE",
  "CORTEGE", "FLEUR", "ROBE", "COSTUME", "VOILE", "CHANSON", "CHŒUR", "CHOEUR", "LOUANGE", "DIEU",
  "SEIGNEUR", "JESUS", "CHRIST", "AMEN", "PÈRE", "PERE", "MÈRE", "MERE", "FRÈRE", "FRERE", "SŒUR", "SOEUR",
  "ENFANT", "MAISON", "CŒUR", "COEUR", "VIE", "JOUR", "HEURE", "TEMPS", "ANNEAU", "INVITE", "INVITEE",
  "TABLE", "MENU", "GATEAU", "PAIN", "VIN", "VERRE", "TOAST", "DANSE", "MUSIQUE", "OR", "ARGENT",
  "KITA", "PAGNE", "BOUQUET", "PHOTO", "ALBUM", "SOUVENIR", "AMI", "AMIE", "PROCHE", "ROSE", "LYS",
  // Common vocabulary A-Z
  "ACTE", "AGIR", "AIDER", "AILE", "AIMER", "AIR", "AISE", "ALLER", "AME", "AMEN", "AMI", "AMIS", "ANGE",
  "ANNE", "ANNEE", "AOUT", "APPEL", "APRES", "ARBRE", "ARCHE", "ARC", "ARME", "ART", "ASSEZ", "AURA",
  "AUTRE", "AVANT", "AVEC", "AVENIR", "AVOIR", "AVRIL", "AZUR",
  "BANC", "BANC", "BAR", "BAS", "BATIR", "BEAU", "BELLE", "BIEN", "BLEU", "BOIS", "BON", "BONTÉ", "BONTE",
  "BORD", "BOUT", "BRAS", "BREF", "BRIN", "BRUT", "BUREAU", "BUT",
  "CADRE", "CALME", "CAMP", "CAPE", "CAR", "CARTE", "CASE", "CAUSE", "CELLE", "CELUI", "CENT", "CERCLE",
  "CECI", "CELA", "CEUX", "CHAIR", "CHAMP", "CHANT", "CHARME", "CHAT", "CHEF", "CHEMIN", "CHER", "CHÈRE",
  "CHEVAL", "CHEVEU", "CHEZ", "CHIEN", "CHOIX", "CIEL", "CINQ", "CITE", "CLAIR", "CLE", "CLEF", "CLIC",
  "COIN", "COL", "COTE", "COUP", "COUR", "COURS", "COURT", "COUT", "CRI", "CROIRE", "CROIX",
  "DAME", "DANS", "DATE", "DEJA", "DELAI", "DEMI", "DENT", "DEUX", "DEVANT", "DEVOIR", "DIEU", "DIRE",
  "DIX", "DOIGT", "DOM", "DON", "DONC", "DONNER", "DORS", "DOUX", "DROIT", "DUR",
  "EAU", "ECHO", "ECOLE", "ECRAN", "ECRIT", "EFFET", "ELAN", "ELLE", "ELLES", "EMEU", "ENTRE", "ENVOI",
  "EPAULE", "EPEE", "EPIS", "ESSAI", "EST", "ETAT", "ETE", "ETOILES", "ETOILE", "ETRE", "EU", "EUX",
  "FACE", "FAIRE", "FAIT", "FEE", "FER", "FÊTE", "FEU", "FIER", "FIL", "FILE", "FILLE", "FILS", "FIN",
  "FINI", "FIXE", "FLOT", "FOND", "FORCE", "FORET", "FORME", "FORT", "FOU", "FOULE", "FOUR", "FRAIS",
  "FRANC", "FROID", "FRONT", "FRUIT",
  "GAGE", "GAIN", "GARDER", "GARE", "GENOU", "GENRE", "GENS", "GEST", "GESTE", "GOUT", "GRAND", "GRAS",
  "GRATUIT", "GROS", "GROUPE", "GUIDE",
  "HABIT", "HAIE", "HAINE", "HAUT", "HERBE", "HEURE", "HIER", "HOMME", "HONTE", "HORS", "HOTE", "HUIT",
  "HUMAIN",
  "IDEE", "IL", "ILS", "ILE", "IMAGE", "ISSUE", "ICI",
  "JAMAIS", "JAMBE", "JARDIN", "JAUNE", "JE", "JEU", "JEUX", "JEUNE", "JOLI", "JOUE", "JOUER", "JOUR",
  "JUGE", "JUILLET", "JUIN", "JUPON", "JUSTE",
  "KILO", "KILOS",
  "LAC", "LAINE", "LAISSER", "LAIT", "LAME", "LAMPE", "LANCE", "LARGE", "LAVAGE", "LAVER", "LE", "LES",
  "LENT", "LEUR", "LEURS", "LEVER", "LIEN", "LIRE", "LIT", "LIVRE", "LOI", "LOIN", "LONG", "LORS",
  "LOUE", "LOUP", "LOURD", "LUEUR", "LUI", "LUMIERE", "LUNE", "LUTTE",
  "MA", "MAIN", "MAIS", "MAL", "MANCHE", "MARCHE", "MARDI", "MATIN", "MEME", "MER", "MERCI", "METTRE",
  "MEUBLE", "MIEN", "MIEUX", "MILIEU", "MILLE", "MINCE", "MINI", "MINUTE", "MODE", "MOI", "MOIS", "MOITIE",
  "MOMENT", "MON", "MONDE", "MONTER", "MONTRE", "MORT", "MOT", "MOTS", "MOYEN", "MUR",
  "NAGE", "NAITRE", "NEZ", "NID", "NOBLE", "NOIR", "NOM", "NOMS", "NON", "NORD", "NOTE", "NOTRE", "NOUVEAU",
  "NOUVEL", "NUIT", "NUL",
  "OBJET", "OCEAN", "OEIL", "OEUF", "OFFRE", "OISEAU", "OMBRE", "ON", "ONCLE", "ONDE", "OR", "ORDRE",
  "OREILLE", "OU", "OUI", "OUTIL", "OUVERT", "OUVRIR",
  "PAGE", "PAIRE", "PAR", "PARC", "PARLER", "PARMI", "PAROLE", "PART", "PAS", "PASSER", "PEAU", "PEINE",
  "PENSEE", "PERE", "PETIT", "PEU", "PEUR", "PIECE", "PIED", "PIERRE", "PLACE", "PLAGE", "PLAIN", "PLAISIR",
  "PLAN", "PLEIN", "PLUIE", "PLUME", "PLUS", "POCHE", "POEME", "POINT", "POISSON", "PONT", "PORTE", "POSER",
  "POSTE", "POUR", "POUVOIR", "PREMIER", "PRENDRE", "PRES", "PRET", "PRIE", "PRIX", "PROJET", "PROMPT", "PUR",
  "QUAND", "QUART", "QUASI", "QUATRE", "QUE", "QUEL", "QUELLE", "QUI", "QUOI",
  "RACE", "RADIO", "RAISON", "RAME", "RANG", "RANGÉE", "RAPIDE", "RARE", "RAS", "RAYON", "RECU", "REGLE",
  "REINE", "RENDRE", "REPOS", "RESTE", "RETOUR", "REVUE", "RICHE", "RIDE", "RIEN", "RIRE", "RIVE", "RIVIERE",
  "ROI", "ROND", "ROUE", "ROUGE", "ROUTE", "RUE",
  "SABLE", "SAC", "SAGE", "SAIN", "SAISON", "SALLE", "SALON", "SANG", "SANS", "SANTE", "SAUT", "SAVOIR",
  "SCENE", "SEC", "SECONDE", "SEIN", "SEIZE", "SEL", "SEMAINE", "SENS", "SEPT", "SERIE", "SERRER", "SEUL",
  "SEULE", "SIEGE", "SIECLE", "SIEN", "SIGNE", "SILENCE", "SIMPLE", "SIX", "SOEUR", "SOIF", "SOIN", "SOIR",
  "SOL", "SOLDAT", "SOLEIL", "SOMME", "SORT", "SORTE", "SORTIR", "SOUCI", "SOUFFLE", "SOUPIR", "SOURCE",
  "SOUS", "STYLE", "SUD", "SUITE", "SUJET", "SUR", "SÛR",
  "TABLEAU", "TAILLE", "TALENT", "TANTE", "TARD", "TARI", "TAS", "TASSE", "TEL", "TELLE", "TEMOIGNAGE",
  "TERRE", "TETE", "TEXTE", "THE", "TIERS", "TIGE", "TIRER", "TITRE", "TOI", "TOIT", "TON", "TONNE",
  "TOTAL", "TOUR", "TOUT", "TOUTE", "TOUS", "TRACE", "TRAIN", "TRAIT", "TRAITEUR", "TRAVAIL", "TRENTE",
  "TRES", "TRIOMPHE", "TRIPLE", "TROIS", "TRONC", "TROP", "TROU", "TUBE", "TYPE",
  "UN", "UNE", "UNION", "UNIQUE", "UNITE", "URGENT", "USAGE", "USER", "UTILE",
  "VAIN", "VALEUR", "VALISE", "VASE", "VENT", "VENTE", "VENUE", "VERITÉ", "VERITE", "VERRE", "VERS",
  "VERSÉE", "VERSET", "VERT", "VESTE", "VIDE", "VIEUX", "VIF", "VILLA", "VILLE", "VIN", "VINGT", "VISAGE",
  "VISION", "VISITE", "VITE", "VIVRE", "VOIE", "VOIR", "VOIX", "VOL", "VOLE", "VOLER", "VOLONTE", "VOS",
  "VOTRE", "VOUS", "VOYAGE", "VRAI", "VUE",
  "YEUX", "ZERO", "ZONE"
];

// Combine base lexicon with comprehensive French dictionary
const COMBINED_DICTIONARY = new Set<string>();

// Prepopulate set
COMPREHENSIVE_FRENCH_DICTIONARY.forEach((w) => {
  COMBINED_DICTIONARY.add(w.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
});
FRENCH_LEXICON_WORDS.forEach((w) => {
  COMBINED_DICTIONARY.add(w.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
});

export function isValidFrenchWord(rawWord: string): boolean {
  if (!rawWord || rawWord.length < 2) return false;
  const clean = rawWord.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // 1. Direct dictionary lookup
  if (COMBINED_DICTIONARY.has(clean)) return true;

  // 2. Common French plural and feminine inflections (e.g., -S, -ES, -E)
  if (clean.endsWith("S") && COMBINED_DICTIONARY.has(clean.slice(0, -1))) return true;
  if (clean.endsWith("ES") && COMBINED_DICTIONARY.has(clean.slice(0, -2))) return true;
  if (clean.endsWith("E") && COMBINED_DICTIONARY.has(clean.slice(0, -1))) return true;

  return false;
}

export const FRENCH_DICTIONARY = COMBINED_DICTIONARY;

// 11x11 Grid Template Multipliers
export function createInitial11x11Board(): BoardCell[][] {
  const board: BoardCell[][] = [];

  for (let r = 0; r < 11; r++) {
    const row: BoardCell[] = [];
    for (let c = 0; c < 11; c++) {
      let mult: MultiplierType = "normal";

      // Center Star at (5, 5)
      if (r === 5 && c === 5) {
        mult = "center";
      }
      // Triple Word (TM): 4 corners
      else if (
        (r === 0 && c === 0) || (r === 0 && c === 10) ||
        (r === 10 && c === 0) || (r === 10 && c === 10)
      ) {
        mult = "tm";
      }
      // Double Word (DM): diagonals
      else if (
        (r === 1 && c === 1) || (r === 2 && c === 2) || (r === 3 && c === 3) ||
        (r === 1 && c === 9) || (r === 2 && c === 8) || (r === 3 && c === 7) ||
        (r === 9 && c === 1) || (r === 8 && c === 2) || (r === 7 && c === 3) ||
        (r === 9 && c === 9) || (r === 8 && c === 8) || (r === 7 && c === 7)
      ) {
        mult = "dm";
      }
      // Triple Letter (TL)
      else if (
        (r === 1 && c === 5) || (r === 5 && c === 1) ||
        (r === 9 && c === 5) || (r === 5 && c === 9)
      ) {
        mult = "tl";
      }
      // Double Letter (DL)
      else if (
        (r === 0 && c === 4) || (r === 0 && c === 6) ||
        (r === 4 && c === 0) || (r === 6 && c === 0) ||
        (r === 10 && c === 4) || (r === 10 && c === 6) ||
        (r === 4 && c === 10) || (r === 6 && c === 10) ||
        (r === 3 && c === 5) || (r === 5 && c === 3) ||
        (r === 7 && c === 5) || (r === 5 && c === 7)
      ) {
        mult = "dl";
      }

      row.push({
        row: r,
        col: c,
        multiplier: mult,
        letter: null,
        points: 0,
        isLocked: false,
      });
    }
    board.push(row);
  }

  return board;
}

export function createLetterBag(): LetterTile[] {
  const bag: LetterTile[] = [];
  let id = 1;
  for (const [letter, count] of Object.entries(TILE_DISTRIBUTION)) {
    const points = LETTER_VALUES[letter] || 1;
    for (let i = 0; i < count; i++) {
      bag.push({
        id: `tile_${letter}_${id++}`,
        letter,
        points,
      });
    }
  }

  // Shuffle bag
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  return bag;
}

export function drawTiles(bag: LetterTile[], count: number): { drawn: LetterTile[]; remaining: LetterTile[] } {
  const drawn = bag.slice(0, count);
  const remaining = bag.slice(count);
  return { drawn, remaining };
}

export function createInitialWordGameState(
  gameMode: "couple" | "ai" | "daily" | "training" = "couple"
): WordGameState {
  const board = createInitial11x11Board();
  let bag = createLetterBag();

  const draw1 = drawTiles(bag, 7);
  const rack1 = draw1.drawn;
  bag = draw1.remaining;

  const draw2 = drawTiles(bag, 7);
  const rack2 = draw2.drawn;
  bag = draw2.remaining;

  // Pre-seed the center with a wedding-themed word for immediate playability if board is empty
  const initialWord = "AMOUR";
  const startCol = 3;
  for (let i = 0; i < initialWord.length; i++) {
    const l = initialWord[i];
    board[5][startCol + i].letter = l;
    board[5][startCol + i].points = LETTER_VALUES[l];
    board[5][startCol + i].isLocked = true;
  }

  return {
    board,
    bag,
    rack1,
    rack2,
    score1: 24, // Initial points from AMOUR
    score2: 0,
    turn: "partner1",
    status: "ongoing",
    winner: null,
    gameMode,
    dailyChallenge: {
      date: new Date().toISOString().split("T")[0],
      letters: ["A", "L", "L", "I", "A", "N", "C"],
      bestWord: "ALLIANCE",
      targetScore: 48,
    },
    history: [
      {
        turnNumber: 1,
        player: "partner1",
        word: "AMOUR",
        score: 24,
      },
    ],
    lastMessage: "Mot d'ouverture 'AMOUR' posé au centre. À vous de connecter votre premier mot !",
  };
}

// Validate placed tiles and calculate word score
export function validateAndScoreWordPlacement(
  board: BoardCell[][],
  placedTiles: PlacedTile[]
): WordMoveResult {
  if (placedTiles.length === 0) {
    return { isValid: false, score: 0, wordsFormed: [], error: "Aucune lettre n'a été posée." };
  }

  // 1. Must be in a straight single line (same row or same column)
  const rows = placedTiles.map((t) => t.row);
  const cols = placedTiles.map((t) => t.col);
  const isHorizontal = rows.every((r) => r === rows[0]);
  const isVertical = cols.every((c) => c === cols[0]);

  if (!isHorizontal && !isVertical) {
    return {
      isValid: false,
      score: 0,
      wordsFormed: [],
      error: "Les lettres doivent être alignées horizontalement ou verticalement.",
    };
  }

  // 2. Must connect with existing locked tiles on board
  let connectsWithBoard = false;
  placedTiles.forEach((tile) => {
    const adjacent = [
      [tile.row - 1, tile.col],
      [tile.row + 1, tile.col],
      [tile.row, tile.col - 1],
      [tile.row, tile.col + 1],
    ];
    for (const [ar, ac] of adjacent) {
      if (ar >= 0 && ar < 11 && ac >= 0 && ac < 11) {
        if (board[ar][ac].isLocked && board[ar][ac].letter) {
          connectsWithBoard = true;
          break;
        }
      }
    }
  });

  if (!connectsWithBoard) {
    return {
      isValid: false,
      score: 0,
      wordsFormed: [],
      error: "Votre mot doit obligatoirement être connecté aux lettres déjà posées sur la grille.",
    };
  }

  // Temporary board with placed tiles
  const tempBoard = board.map((r) => r.map((c) => ({ ...c })));
  placedTiles.forEach((pt) => {
    tempBoard[pt.row][pt.col].letter = pt.letter;
    tempBoard[pt.row][pt.col].points = pt.points;
  });

  // Extract main word along line
  let wordsFormed: string[] = [];
  let totalScore = 0;

  if (isHorizontal) {
    const r = rows[0];
    let minC = Math.min(...cols);
    let maxC = Math.max(...cols);

    // Expand to find full continuous word
    while (minC > 0 && tempBoard[r][minC - 1].letter) minC--;
    while (maxC < 10 && tempBoard[r][maxC + 1].letter) maxC++;

    let word = "";
    let wordScore = 0;
    let wordMultiplier = 1;

    for (let c = minC; c <= maxC; c++) {
      const cell = tempBoard[r][c];
      word += cell.letter;

      let letterPoints = cell.points;
      const isNewlyPlaced = placedTiles.some((pt) => pt.row === r && pt.col === c);

      if (isNewlyPlaced) {
        if (cell.multiplier === "dl") letterPoints *= 2;
        if (cell.multiplier === "tl") letterPoints *= 3;
        if (cell.multiplier === "dm") wordMultiplier *= 2;
        if (cell.multiplier === "tm") wordMultiplier *= 3;
      }

      wordScore += letterPoints;
    }

    if (word.length >= 2) {
      wordsFormed.push(word);
      totalScore += wordScore * wordMultiplier;
    }
  } else {
    // Vertical line
    const c = cols[0];
    let minR = Math.min(...rows);
    let maxR = Math.max(...rows);

    while (minR > 0 && tempBoard[minR - 1][c].letter) minR--;
    while (maxR < 10 && tempBoard[maxR + 1][c].letter) maxR++;

    let word = "";
    let wordScore = 0;
    let wordMultiplier = 1;

    for (let r = minR; r <= maxR; r++) {
      const cell = tempBoard[r][c];
      word += cell.letter;

      let letterPoints = cell.points;
      const isNewlyPlaced = placedTiles.some((pt) => pt.row === r && pt.col === c);

      if (isNewlyPlaced) {
        if (cell.multiplier === "dl") letterPoints *= 2;
        if (cell.multiplier === "tl") letterPoints *= 3;
        if (cell.multiplier === "dm") wordMultiplier *= 2;
        if (cell.multiplier === "tm") wordMultiplier *= 3;
      }

      wordScore += letterPoints;
    }

    if (word.length >= 2) {
      wordsFormed.push(word);
      totalScore += wordScore * wordMultiplier;
    }
  }

  // 3. Verify that all formed words are legitimate in French dictionary
  for (const w of wordsFormed) {
    if (!isValidFrenchWord(w)) {
      return {
        isValid: false,
        score: 0,
        wordsFormed,
        error: `Le mot '${w}' n'est pas reconnu dans le dictionnaire français de Wedding Mood.`,
      };
    }
  }

  // Bonus 30 pts for using all 7 rack tiles (Scrabble)
  if (placedTiles.length === 7) {
    totalScore += 30;
  }

  return {
    isValid: true,
    score: totalScore,
    wordsFormed,
  };
}

// Computer AI Word Finder: Looks for valid placements from its rack
export function findComputerWordMove(
  board: BoardCell[][],
  rack: LetterTile[]
): PlacedTile[] | null {
  const rackLetters = rack.map((t) => t.letter);

  // Search horizontal anchor squares next to existing locked tiles
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 11; c++) {
      if (board[r][c].isLocked && board[r][c].letter) {
        const anchorLetter = board[r][c].letter!;

        // Find candidate words in dictionary containing anchorLetter and rack letters
        for (const candidate of FRENCH_DICTIONARY) {
          if (candidate.length >= 3 && candidate.length <= 6 && candidate.includes(anchorLetter)) {
            const anchorIdx = candidate.indexOf(anchorLetter);
            const startCol = c - anchorIdx;

            if (startCol >= 0 && startCol + candidate.length <= 11) {
              const placed: PlacedTile[] = [];
              let canPlace = true;
              const usedRackIndices = new Set<number>();

              for (let i = 0; i < candidate.length; i++) {
                const targetC = startCol + i;
                const char = candidate[i];

                if (board[r][targetC].isLocked) {
                  if (board[r][targetC].letter !== char) {
                    canPlace = false;
                    break;
                  }
                } else {
                  // Find tile from rack
                  const tileIdx = rack.findIndex(
                    (t, idx) => t.letter === char && !usedRackIndices.has(idx)
                  );
                  if (tileIdx === -1) {
                    canPlace = false;
                    break;
                  }
                  usedRackIndices.add(tileIdx);
                  placed.push({
                    row: r,
                    col: targetC,
                    letter: char,
                    points: LETTER_VALUES[char] || 1,
                    tileId: rack[tileIdx].id,
                  });
                }
              }

              if (canPlace && placed.length > 0) {
                const check = validateAndScoreWordPlacement(board, placed);
                if (check.isValid) {
                  return placed;
                }
              }
            }
          }
        }
      }
    }
  }

  return null;
}
