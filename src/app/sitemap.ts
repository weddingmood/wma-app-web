import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.weddingmood.site";
  const now = new Date();
  return ["", "/abonnement", "/marketplace", "/faq", "/cgv", "/cgu", "/confidentialite", "/mentions-legales", "/devenir-ambassadeur", "/devenir-prestataire", "/telechargement"].map((p) => ({
    url: base + p,
    lastModified: now,
  }));
}