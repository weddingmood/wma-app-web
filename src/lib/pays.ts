/**
 * src/lib/pays.ts
 * ---------------------------------------------------------------------------
 * Pilier 1 : cérémonies configurables par pays.
 * Logique pure (aucun import serveur) : utilisable côté client et côté Route
 * Handler, et testable sans base de données.
 *
 * Chaque pays propose ses étapes. Le couple active celles qu'il célèbre,
 * renomme chaque étape dans ses propres mots, puis les classe.
 * Les intitulés proposés sont volontairement sobres : le couple les remplace
 * par les siens (champ `label`), rien n'est imposé à l'invitation.
 */

export type CodePays = "CI" | "SN" | "ML" | "CM";

export interface CeremonieDefaut {
  key: "fiancailles" | "civil" | "religieuse" | "traditionnelle" | "reception";
  label: string;
  defaut: boolean;
  ordre: number;
}

export interface Pays {
  code: CodePays;
  nom: string;
  court: string;
  devise: string;
  indicatif: string;
  villes: string[];
  ceremonies: CeremonieDefaut[];
}

export const PAYS: Pays[] = [
  {
    code: "CI", nom: "Côte d'Ivoire", court: "CI", devise: "XOF", indicatif: "+225",
    villes: ["Abidjan", "Yamoussoukro", "Bouaké", "San-Pédro", "Korhogo", "Daloa", "Grand-Bassam", "Man"],
    ceremonies: [
      { key: "fiancailles",     label: "Fiançailles et dot",   defaut: true,  ordre: 1 },
      { key: "civil",           label: "Mariage civil",        defaut: true,  ordre: 2 },
      { key: "religieuse",      label: "Bénédiction nuptiale", defaut: true,  ordre: 3 },
      { key: "traditionnelle",  label: "Cérémonie traditionnelle", defaut: false, ordre: 4 },
      { key: "reception",       label: "Réception",            defaut: true,  ordre: 5 }
    ]
  },
  {
    code: "SN", nom: "Sénégal", court: "SN", devise: "XOF", indicatif: "+221",
    villes: ["Dakar", "Thiès", "Saint-Louis", "Touba", "Mbour", "Ziguinchor", "Rufisque"],
    ceremonies: [
      { key: "fiancailles",     label: "Fiançailles",          defaut: true,  ordre: 1 },
      { key: "traditionnelle",  label: "Cérémonie coutumière", defaut: true,  ordre: 2 },
      { key: "religieuse",      label: "Cérémonie religieuse", defaut: true,  ordre: 3 },
      { key: "civil",           label: "Mariage civil",        defaut: false, ordre: 4 },
      { key: "reception",       label: "Réception",            defaut: true,  ordre: 5 }
    ]
  },
  {
    code: "ML", nom: "Mali", court: "ML", devise: "XOF", indicatif: "+223",
    villes: ["Bamako", "Sikasso", "Mopti", "Ségou", "Kayes", "Koulikoro"],
    ceremonies: [
      { key: "fiancailles",     label: "Fiançailles",          defaut: true,  ordre: 1 },
      { key: "traditionnelle",  label: "Cérémonie coutumière", defaut: true,  ordre: 2 },
      { key: "religieuse",      label: "Cérémonie religieuse", defaut: true,  ordre: 3 },
      { key: "civil",           label: "Mariage civil",        defaut: false, ordre: 4 },
      { key: "reception",       label: "Réception",            defaut: true,  ordre: 5 }
    ]
  },
  {
    code: "CM", nom: "Cameroun", court: "CM", devise: "XAF", indicatif: "+237",
    villes: ["Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua", "Limbé", "Kribi"],
    ceremonies: [
      { key: "fiancailles",     label: "Fiançailles",          defaut: true,  ordre: 1 },
      { key: "civil",           label: "Mariage civil",        defaut: true,  ordre: 2 },
      { key: "traditionnelle",  label: "Cérémonie traditionnelle", defaut: true, ordre: 3 },
      { key: "religieuse",      label: "Cérémonie religieuse", defaut: true,  ordre: 4 },
      { key: "reception",       label: "Réception",            defaut: true,  ordre: 5 }
    ]
  }
];

export const getPays = (code?: string | null): Pays =>
  PAYS.find(p => p.code === String(code || "CI").toUpperCase()) || PAYS[0];

export const codesPays = () => PAYS.map(p => p.code);

export const villesDe = (code?: string | null): string[] => getPays(code).villes;

export const deviseDe = (code?: string | null): string => getPays(code).devise;

export const symboleDevise = (code?: string | null): string =>
  deviseDe(code) === "XAF" ? "FCFA" : "FCFA";

/** Cérémonies proposées par défaut pour un pays. */
export const ceremoniesDuPays = (code?: string | null): CeremonieDefaut[] => getPays(code).ceremonies;

/**
 * Cérémonies réellement affichées pour un couple : fusion entre l'état
 * enregistré en base et les propositions du pays.
 * `enregistrees` vient de la table ceremonies (ou d'un champ JSON du couple).
 */
export function ceremoniesDuCouple(codePays: string | null | undefined, enregistrees?: any[]): CeremonieDefaut[] {
  const defauts = ceremoniesDuPays(codePays);
  if (!Array.isArray(enregistrees) || enregistrees.length === 0) return defauts;

  const parCle = new Map<string, any>();
  for (const e of enregistrees) {
    const key = String(e.key || e.cle || "").toLowerCase();
    if (key) parCle.set(key, e);
  }

  const fusion = defauts.map(d => {
    const e = parCle.get(d.key);
    return {
      ...d,
      label: e?.label || e?.intitule || d.label,
      defaut: e ? Boolean(e.is_enabled ?? e.isEnabled ?? e.active) : d.defaut,
      ordre: Number(e?.position ?? e?.ordre ?? d.ordre)
    } as CeremonieDefaut;
  });

  // étapes ajoutées par le couple, absentes des propositions du pays
  for (const [key, e] of parCle) {
    if (!fusion.some(f => f.key === key)) {
      fusion.push({ key: key as any, label: e.label || key, defaut: Boolean(e.is_enabled ?? e.isEnabled), ordre: Number(e.position ?? 99) });
    }
  }

  return fusion.sort((a, b) => a.ordre - b.ordre);
}

/** Étapes actives, dans l'ordre du jour : ce que voit l'invité. */
export function etapesActives(codePays: string | null | undefined, enregistrees?: any[]) {
  return ceremoniesDuCouple(codePays, enregistrees).filter(c => c.defaut);
}

/** Normalise l'état renvoyé par un formulaire (cases à cocher + intitulés). */
export function normaliserEtat(codePays: string | null | undefined, brut: any): CeremonieDefaut[] {
  const entree = Array.isArray(brut) ? brut : (brut?.ceremonies || brut?.etapes || []);
  return ceremoniesDuCouple(codePays, entree).map((c, i) => ({ ...c, ordre: i + 1 }));
}

/* ── Formats monétaires ─────────────────────────────────────────────────── */

/** 1 500 000 FCFA (espace insécable normalisée en espace simple). */
export function montant(n: number | string | null | undefined, codePays?: string | null): string {
  const v = Number(n || 0);
  const nombre = new Intl.NumberFormat("fr-FR").format(Math.round(v)).replace(/[\u00A0\u202F\u2007]/g, " ");
  return `${nombre} ${symboleDevise(codePays)}`;
}

/** Tranches de budget proposées à l'inscription, adaptées au pays. */
export function tranchesBudget(codePays?: string | null) {
  const u = deviseDe(codePays);
  return [
    { key: "alliance",    label: "Alliance Essentielle",  min: 250000,  max: 1000000,  texte: `250 000 à 1 000 000 ${u === "XAF" ? "FCFA" : "FCFA"}` },
    { key: "foyer",       label: "Foyer Chic",            min: 1000000, max: 2500000,  texte: `1 000 000 à 2 500 000 FCFA` },
    { key: "benediction", label: "Bénédiction Élégante",  min: 2500000, max: 5000000,  texte: `2 500 000 à 5 000 000 FCFA` }
  ];
}
