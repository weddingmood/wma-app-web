// Envoi d'un evenement a la Conversions API de Facebook.
// Version de l'API Graph : v19.0 par defaut, modifiable avec FB_GRAPH_VERSION
// (Meta redirige automatiquement les versions expirees vers la plus ancienne encore disponible).

export interface CapiConfig {
  pixelId: string;
  accessToken: string;
  testEventCode?: string | null;
}

export interface CapiEventInput {
  eventId: string;          // meme valeur que l'eventID du pixel navigateur : Meta deduplique
  eventName: string;        // PageView | ViewContent | Lead | Purchase
  eventTime: number;        // secondes Unix
  eventSourceUrl?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  emailHash?: string | null; // SHA-256 deja calcule
  userAgent?: string | null;
  ip?: string | null;        // IP complete, uniquement en memoire (jamais stockee)
  value?: number | null;
  currency?: string | null;
}

export interface CapiResult {
  ok: boolean;
  status: number;
  detail: string;
}

export async function sendToFacebookCAPI(cfg: CapiConfig, e: CapiEventInput): Promise<CapiResult> {
  const userData: Record<string, unknown> = {};
  if (e.emailHash) userData.em = [e.emailHash];
  if (e.fbp) userData.fbp = e.fbp;
  if (e.fbc) userData.fbc = e.fbc;
  if (e.ip) userData.client_ip_address = e.ip;
  if (e.userAgent) userData.client_user_agent = e.userAgent;

  const customData: Record<string, unknown> = {};
  if (e.eventName === "Purchase") {
    customData.value = Number(e.value) || 0;
    customData.currency = e.currency || "XOF";
  } else if (e.value) {
    customData.value = Number(e.value);
    customData.currency = e.currency || "XOF";
  }

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: e.eventName,
        event_time: e.eventTime,
        event_id: e.eventId,
        event_source_url: e.eventSourceUrl || undefined,
        action_source: "website",
        user_data: userData,
        custom_data: customData,
      },
    ],
    access_token: cfg.accessToken,
  };
  if (cfg.testEventCode) payload.test_event_code = cfg.testEventCode;

  const version = process.env.FB_GRAPH_VERSION || "v19.0";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch("https://graph.facebook.com/" + version + "/" + encodeURIComponent(cfg.pixelId) + "/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await res.text();
    let received = 0;
    try {
      received = Number(JSON.parse(text).events_received ?? 0);
    } catch {
      received = 0;
    }
    return { ok: res.ok && received >= 1, status: res.status, detail: res.ok ? "events_received=" + received : text.slice(0, 400) };
  } catch (error) {
    return { ok: false, status: 0, detail: error instanceof Error ? error.message : "erreur reseau" };
  } finally {
    clearTimeout(timer);
  }
}