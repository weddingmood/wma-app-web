// Listes fixes utilisees par le formulaire d'inscription prestataire
// et par la marketplace (filtres). Nouveau fichier, ne touche a rien d'existant.

export const PROVIDER_SERVICES: { id: string; label: string }[] = [
  { id: "traiteur", label: "Traiteur" },
  { id: "decorateur", label: "Décorateur" },
  { id: "photographe", label: "Photographe" },
  { id: "videaste", label: "Vidéaste" },
  { id: "dj_sono", label: "DJ / Sonorisation" },
  { id: "salle", label: "Salle de réception" },
  { id: "makeup_coiffure", label: "Makeup / Coiffure" },
  { id: "robe_tenues", label: "Robe & Tenues" },
  { id: "patisserie", label: "Pâtisserie / Gâteau" },
  { id: "fleuriste", label: "Fleuriste" },
  { id: "transport", label: "Transport / Location voiture" },
  { id: "animation_mc", label: "Animation / MC" },
  { id: "autre", label: "Autre" },
];

export const PROVIDER_CITIES: string[] = [
  "Abidjan",
  "Dakar",
  "Lomé",
  "Cotonou",
  "Ouagadougou",
  "Bamako",
  "Yamoussoukro",
  "Autre",
];