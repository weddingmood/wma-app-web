import "server-only";

const RESEND_URL = "https://api.resend.com/emails";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SendEmailResult = { ok: boolean; id?: string; error?: string };

// Ne lance jamais d'exception : un echec d'e-mail ne doit pas casser une inscription ou un paiement.
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "Wedding Mood <portail@weddingmood.site>";
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY manquante" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message || "HTTP " + res.status };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: "Envoi impossible (reseau ou delai depasse)" };
  } finally {
    clearTimeout(timer);
  }
}