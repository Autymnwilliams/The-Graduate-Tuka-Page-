import twilio from "twilio";
import type { Hotel, Rec } from "./types";
import { isOptedOut } from "./smsOptOut";

/**
 * Env var names match backend_main's config/twilio.js for consistency
 * across the two codebases, even though only this app is live.
 */
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let client: ReturnType<typeof twilio> | null | undefined;

function getClient() {
  if (client !== undefined) return client;

  if (!ACCOUNT_SID || !API_KEY_SID || !API_KEY_SECRET) {
    console.warn("[sms] Twilio env vars not fully set — SMS sends will be skipped.");
    client = null;
    return client;
  }

  client = twilio(API_KEY_SID, API_KEY_SECRET, { accountSid: ACCOUNT_SID });
  return client;
}

export async function sendSms(to: string, body: string): Promise<void> {
  const c = getClient();
  if (!c || !FROM_NUMBER) {
    console.warn("[sms] Skipped send — Twilio not fully configured.");
    return;
  }
  // Required for the privacy policy's "Reply STOP to opt out" disclosure to
  // actually be true, and expected by carriers for A2P approval -- checked
  // here, not per-caller, so every send path (concierge text, chat handoff,
  // future recap SMS) is covered without having to remember to add it.
  if (await isOptedOut(to)) {
    console.warn("[sms] Skipped send — recipient has opted out:", to);
    return;
  }
  await c.messages.create({ to, from: FROM_NUMBER, body });
}

/** Concierge text sent when a guest likes/favorites a rec. Never books anything itself — just hands off the link. */
export async function sendConciergeText(
  phone: string,
  hotel: Hotel,
  rec: Rec,
  guest?: { name?: string; stayLength?: string },
): Promise<void> {
  const greeting = guest?.name ? `Hey ${guest.name}!` : "Hey!";
  const stayNote = guest?.stayLength ? ` Hope the ${guest.stayLength} stay is going well —` : "";
  const body =
    `${greeting} We noticed you liked ${rec.name} near ${hotel.name}.${stayNote} ` +
    `I'm your digital concierge — here's the link to book: ` +
    `${rec.bookingLink || "(no booking link on file yet — ask the front desk!)"}`;

  try {
    await sendSms(phone, body);
  } catch (err) {
    // Best-effort — a failed/unconfigured Twilio send should never fail the like/favorite action itself.
    console.warn("[sms] sendConciergeText failed:", err instanceof Error ? err.message : err);
  }
}
