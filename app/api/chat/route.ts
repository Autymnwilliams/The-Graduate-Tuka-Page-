import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getHotelBySlug } from "@/lib/hotels";
import { recordEvent } from "@/lib/analytics";
import { getLeadStore } from "@/lib/leads";
import { GUEST_ID_COOKIE, GUEST_ID_COOKIE_MAX_AGE_SECONDS } from "@/lib/guest";
import type { Hotel } from "@/lib/types";

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

interface HistoryTurn {
  role: "user" | "bot";
  text: string;
}

/**
 * Guardrails (tasks.md): the concierge is scoped to exactly four things --
 * open by offering to book, collect name+number, answer questions about
 * this hotel's own recs, or hand off anything else to a human via email.
 * Enforced by instruction only (Gemini has no tool access beyond replying),
 * so the JSON contract below is what lets the app actually act on it --
 * "ask for name and number" is pointless if the app never saves what the
 * guest provides.
 */
function buildPrompt(hotel: Hotel, history: HistoryTurn[], message: string): string {
  const recLines = hotel.recs
    .map((r) => `- id:${r.id} | ${r.name} (${r.category}) — ${r.shortDescription}`)
    .join("\n");

  const historyLines = history
    .map((turn) => `${turn.role === "user" ? "Guest" : "You"}: ${turn.text}`)
    .join("\n");

  return `You are the digital concierge for ${hotel.name}, chatting with a hotel guest. Stay strictly within these four behaviors:
1. If this is the start of the conversation, greet the guest and offer to help book a table/appointment at one of the hotel's recommended places.
2. If you don't already have the guest's name and phone number from earlier in this conversation, ask for them (once, naturally -- don't re-ask if already given).
3. Answer general questions about the recommendations below or the hotel itself, using ONLY the list below -- never recommend or invent anything outside it.
4. If the guest asks for anything outside those three things (complaints, requests you can't fulfill, unrelated topics), tell them you'll connect them with the front desk / customer service, and ask for their email if you don't have it yet.

Curated recommendations for ${hotel.name}:
${recLines || "(no recommendations on file yet)"}

${historyLines ? `Conversation so far:\n${historyLines}\n` : "(This is the first message in the conversation.)"}
Guest: ${message}

Return ONLY this exact JSON format, nothing else:
{
  "reply": "your conversational response",
  "recommendedIds": ["id1", "id2"],
  "contact": {"name": "guest's name if they just gave it, else omit", "phone": "guest's phone if they just gave it, else omit", "email": "guest's email if they just gave it, else omit"}
}
recommendedIds must only contain ids from the list above, and can be empty. Omit "contact" entirely, or omit its fields, when the guest hasn't provided that info in their latest message. In "reply", refer to recommendations by name only -- never write their internal "id:..." token, the guest should never see that.`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { hotelSlug, message, history: rawHistory } = body as Record<string, unknown>;
  if (typeof hotelSlug !== "string" || typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "hotelSlug and message are required" }, { status: 400 });
  }

  const history: HistoryTurn[] = Array.isArray(rawHistory)
    ? rawHistory.filter(
        (t): t is HistoryTurn =>
          typeof t === "object" && t !== null && (t.role === "user" || t.role === "bot") && typeof t.text === "string",
      )
    : [];

  const hotel = await getHotelBySlug(hotelSlug);
  if (!hotel) {
    return Response.json({ error: "Hotel not found" }, { status: 404 });
  }

  if (!genAI) {
    return Response.json({ error: "Chat is not configured (GEMINI_API_KEY missing)" }, { status: 503 });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
    });
    const result = await model.generateContent(buildPrompt(hotel, history, message.trim()));
    const raw = result.response.text();
    const cleaned = raw.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: { reply?: string; recommendedIds?: string[]; contact?: { name?: string; phone?: string; email?: string } };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { reply: raw.trim(), recommendedIds: [] };
    }

    const validIds = new Set(hotel.recs.map((r) => r.id));
    const recommendedIds = (parsed.recommendedIds ?? []).filter((id) => validIds.has(id));

    // Backstop in case the model ignores the reply-formatting instruction --
    // LLM instruction-following isn't guaranteed, and a leaked internal id
    // looks broken to a guest.
    const reply = (parsed.reply ?? "")
      .replace(/,?\s*\bid:rec_[a-zA-Z0-9_]+\b,?/g, "")
      .replace(/ {2,}/g, " ")
      .trim();

    const contact = parsed.contact;
    if (contact?.name || contact?.phone || contact?.email) {
      const cookieStore = await cookies();
      let guestId = cookieStore.get(GUEST_ID_COOKIE)?.value;
      if (!guestId) {
        guestId = randomUUID();
        cookieStore.set(GUEST_ID_COOKIE, guestId, {
          maxAge: GUEST_ID_COOKIE_MAX_AGE_SECONDS,
          path: "/",
          httpOnly: true,
          sameSite: "lax",
        });
      }
      // Same synthetic-email pattern as /api/chat/handoff -- most guests
      // give a name/phone long before (if ever) an email, and leads are
      // keyed by email, so this keeps the lead resolvable via guestId
      // regardless of which contact fields have shown up so far.
      await getLeadStore().upsertLead({
        email: contact.email?.trim() || `guest-${guestId}@no-email.tuka`,
        name: contact.name?.trim() ?? "",
        phone: contact.phone?.trim(),
        guestId,
        hotelSlug,
      });
    }

    await recordEvent({
      type: "chat_message",
      hotelSlug,
      timestamp: new Date().toISOString(),
      data: { recommendedCount: recommendedIds.length },
    });

    return Response.json({ reply, recommendedIds });
  } catch (err) {
    console.error("[chat] Gemini error:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Chat failed, try again" }, { status: 500 });
  }
}
