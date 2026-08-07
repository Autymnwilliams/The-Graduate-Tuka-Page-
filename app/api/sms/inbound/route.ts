import twilio from "twilio";
import { addOptOut, removeOptOut } from "@/lib/smsOptOut";

/**
 * Twilio inbound SMS webhook -- handles STOP/START/HELP replies so the
 * privacy policy's SMS disclosures (opt-out, opt back in, help) are
 * actually true, not just text on a page. Point Twilio's "A Message Comes
 * In" webhook (Console > Phone Numbers > your number > Messaging) at
 * POST /api/sms/inbound.
 */
const STOP_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const START_KEYWORDS = new Set(["START", "YES", "UNSTOP"]);
const HELP_KEYWORDS = new Set(["HELP", "INFO"]);

function twiml(message?: string): Response {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response/>`;
  return new Response(body, { headers: { "Content-Type": "text/xml" } });
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature = request.headers.get("x-twilio-signature") ?? "";
    const url = request.url;
    const paramsObj = Object.fromEntries(params.entries());
    const valid = twilio.validateRequest(authToken, signature, url, paramsObj);
    if (!valid) {
      return new Response("Invalid signature", { status: 403 });
    }
  } else {
    console.warn("[sms/inbound] TWILIO_AUTH_TOKEN not set — skipping signature verification (not recommended for production).");
  }

  const from = params.get("From") ?? "";
  const body = (params.get("Body") ?? "").trim().toUpperCase();

  if (!from) return twiml();

  if (STOP_KEYWORDS.has(body)) {
    await addOptOut(from);
    return twiml("You've been unsubscribed from Tuka concierge texts and won't receive more messages. Reply START to resubscribe.");
  }

  if (START_KEYWORDS.has(body)) {
    await removeOptOut(from);
    return twiml("You're resubscribed to Tuka concierge texts. Reply STOP at any time to opt out.");
  }

  if (HELP_KEYWORDS.has(body)) {
    return twiml("Tuka concierge: message frequency varies. Msg & data rates may apply. Reply STOP to opt out. Contact support@thecirclesearch.com for help.");
  }

  // Anything else -- no auto-reply, this endpoint isn't a full bidirectional chat loop.
  return twiml();
}
