import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/ambassadeur", "/confirmation-paiement", "/invitation/", "/r/", "/reset-connexion"] }],
    sitemap: "https://www.weddingmood.site/sitemap.xml",
  };
}