import type { ThemeDefinition } from "@/lib/constants";

export function normalizeHex(value: string): string {
  const s = value.trim();
  const h = s.startsWith("#") ? s : "#" + s;
  if (/^#[0-9a-fA-F]{3}$/.test(h)) {
    return ("#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]).toUpperCase();
  }
  return h.toUpperCase();
}

export function isValidHex(value: string): boolean {
  return /^#[0-9A-F]{6}$/.test(value);
}

function toRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function toHex(r: number, g: number, b: number): string {
  const part = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return ("#" + part(r) + part(g) + part(b)).toUpperCase();
}

// Mélange la couleur "a" vers la couleur "b" (t entre 0 et 1)
function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function luminance(hex: string): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = toRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Assombrit légèrement une couleur trop claire pour garder un texte blanc lisible
export function readablePrimary(hex: string): string {
  let c = hex;
  for (let i = 0; i < 40 && 1.05 / (luminance(c) + 0.05) < 4.5; i++) c = mix(c, "#000000", 0.05);
  return c;
}

export function buildCustomTheme(hex: string, base: ThemeDefinition): ThemeDefinition {
  const primary = readablePrimary(normalizeHex(hex));
  const hover = mix(primary, "#000000", 0.15);
  return {
    ...base,
    id: 0,
    name: "Couleur personnalis\u00e9e",
    category: "Personnalis\u00e9",
    primary,
    primaryHover: hover,
    badgeBg: mix(primary, "#FFFFFF", 0.9),
    badgeText: hover,
    previewColor: primary,
  };
}
export function mixColors(a: string, b: string, t: number): string {
  return mix(a, b, t);
}

export function contrastWith(hex: string, other: string): number {
  const l1 = luminance(hex);
  const l2 = luminance(other);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function readableText(hex: string): string {
  let c = normalizeHex(hex);
  for (let i = 0; i < 40 && contrastWith(c, "#FFFFFF") < 4.5; i++) c = mix(c, "#000000", 0.05);
  return c;
}

export function onColor(bg: string): string {
  return contrastWith(bg, "#FFFFFF") >= contrastWith(bg, "#000000") ? "#FFFFFF" : "#000000";
}
