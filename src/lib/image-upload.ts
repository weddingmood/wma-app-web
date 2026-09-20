/**
 * Lecture d'une image locale (galerie / stockage) + redimensionnement Canvas
 * et compression JPEG, renvoyée sous forme de data URL prête à être stockée.
 * À utiliser uniquement côté client ("use client").
 */
export interface ImageCompressionOptions {
  /** Plus grand côté autorisé en pixels (défaut : 1200) */
  maxSize?: number;
  /** Qualité JPEG entre 0 et 1 (défaut : 0.8) */
  quality?: number;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Lecture du fichier impossible."));
    };
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image invalide."));
    img.src = src;
  });
}

export async function fileToCompressedDataUrl(
  file: File,
  { maxSize = 1200, quality = 0.8 }: ImageCompressionOptions = {}
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier sélectionné n'est pas une image.");
  }

  const original = await readFileAsDataUrl(file);
  const img = await loadImage(original);

  const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * ratio));
  const height = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;

  // Fond blanc : évite un fond noir pour les PNG transparents une fois en JPEG
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}
