import { headers } from "next/headers";
import { PUBLIC_KEYS, readSettings } from "@/lib/wma-settings";

export async function legalVars(): Promise<{ vars: Record<string, string>; override: { terms: string; privacy: string } }> {
  const s = await readSettings(PUBLIC_KEYS);
  const get = (k: string) => (s[k] || "").trim();
  let host = "";
  try { host = (await headers()).get("host") || ""; } catch {}
  const rccm = get("rccm");
  const dfe = get("dfe");
  const vars: Record<string, string> = {
    ENTREPRISE: get("company_name") || "ETS IVOIRSTORES",
    ADRESSE: get("address") || "Bouaké, quartier Ahougnansou, Côte d'Ivoire",
    RCCM: rccm ? "n° " + rccm : "en cours d'immatriculation (greffe de Bouaké)",
    DFE: dfe ? "n° " + dfe : "en cours d'obtention",
    EMAIL: get("email_contact") || "portail@weddingmood.site",
    TEL: get("phone"),
    WHATSAPP: get("whatsapp") || "+225 70 50 13 56",
    SITE: host || "weddingmood.site",
  };
  return { vars, override: { terms: get("terms"), privacy: get("privacy") } };
}