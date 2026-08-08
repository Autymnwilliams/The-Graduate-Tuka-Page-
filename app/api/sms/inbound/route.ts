import twilio from "twilio";
import { addOptOut, removeOptOut } from "@/lib/smsOptOut";

/**
 * Twilio inbound SMS webhook -- handles STOP/START/HELP replies so the
 * privacy policy's SMS disclosures (opt-out, opt back in, help) are
 * actually true, not just text on a page. Point Twilio's "A Message Comes
 * In" webhook (Console > Phone Numbers > your number > Messaging) at
 * POST /api/sms/inbound.
 */
// Keeping this list in sync with exactly what's declared in the Twilio A2P
// campaign registration -- Twilio's reviewers/automation text the number
// and compare the actual reply against what's registered.
const STOP_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "OPTOUT", "REVOKE"]);
const START_KEYWORDS = new Set(["START", "YES", "UNSTOP", "TUKA"]);
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
    // Brand name required (A2P rejection 30887: opt-out message must
    // include acknowledgement, confirmation no further messages will be
    // sent, AND the brand name).
    return twiml("Tuka: You have successfully been unsubscribed. You will not receive any more messages from this number. Reply START to resubscribe.");
  }

  if (START_KEYWORDS.has(body)) {
    await removeOptOut(from);
    return twiml(
      "Tuka: You're opted in to concierge text messages. Msg frequency varies, msg & data rates may apply. For help, reply HELP. To opt out, reply STOP.",
    );
  }

  if (HELP_KEYWORDS.has(body)) {
    // Brand name + contact required (A2P rejection 30890: HELP reply must
    // include brand name, phone number, or email so end users know who
    // they're talking to and how to reach a human).
    return twiml("Tuka: For help, contact support@thecirclesearch.com. Reply STOP to unsubscribe. Msg & data rates may apply.");
  }

  // Anything else -- no auto-reply, this endpoint isn't a full bidirectional chat loop.
  return twiml();
}
