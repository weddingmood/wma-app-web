// Envoi WhatsApp (Meta Cloud API), usage serveur uniquement
const GRAPH_URL = "https://graph.facebook.com/v21.0";

export function normalizePhone(raw: string): string | null {
  let d = String(raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.length === 10) d = "225" + d;
  return /^\d{11,15}$/.test(d) ? d : null;
}

export async function sendAccessCodeWhatsApp(
  phone: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const template = process.env.WHATSAPP_TEMPLATE_NAME;

  if (!phoneId || !token) return { ok: false, error: "WhatsApp non configuré" };
  const to = normalizePhone(phone);
  if (!to) return { ok: false, error: "Numéro invalide" };
  if (!code) return { ok: false, error: "Code manquant" };

  const payload = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: "fr" },
          components: [{ type: "body", parameters: [{ type: "text", text: code }] }],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: "Votre code WeddingMood est : " + code },
      };

  try {
    const res = await fetch(GRAPH_URL + "/" + phoneId + "/messages", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[whatsapp] refus Meta:", data?.error?.code, data?.error?.message);
      return { ok: false, error: data?.error?.message || "HTTP " + res.status };
    }
    return { ok: true };
  } catch (e) {
    console.error("[whatsapp] échec réseau:", e);
    return { ok: false, error: "Service WhatsApp injoignable" };
  }
}
export async function sendAmbassadorCredentialsWhatsApp(
  phone: string,
  codeUnique: string,
  pin: string
): Promise<{ ok: boolean; error?: string }> {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const template = process.env.WHATSAPP_TEMPLATE_AMBASSADOR;
  if (!phoneId || !token || !template) return { ok: false, error: "Modèle ambassadeur non configuré" };
  const to = normalizePhone(phone);
  if (!to) return { ok: false, error: "Numéro invalide" };
  try {
    const res = await fetch(GRAPH_URL + "/" + phoneId + "/messages", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: "fr" },
          components: [{ type: "body", parameters: [
            { type: "text", text: codeUnique },
            { type: "text", text: pin },
          ] }],
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[whatsapp] refus Meta (ambassadeur):", data?.error?.code, data?.error?.message);
      return { ok: false, error: data?.error?.message || "HTTP " + res.status };
    }
    return { ok: true };
  } catch (e) {
    console.error("[whatsapp] échec réseau (ambassadeur):", e);
    return { ok: false, error: "Service WhatsApp injoignable" };
  }
}