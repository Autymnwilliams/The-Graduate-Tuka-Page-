import { GoogleGenerativeAI } from "@google/generative-ai";
import { getHotelBySlug } from "@/lib/hotels";
import { recordEvent } from "@/lib/analytics";
import type { Hotel } from "@/lib/types";

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

function buildPrompt(hotel: Hotel, message: string): string {
  const recLines = hotel.recs
    .map((r) => `- id:${r.id} | ${r.name} (${r.category}) — ${r.shortDescription}`)
    .join("\n");

  return `You are the digital concierge for ${hotel.name}. A guest is chatting with you about things to do nearby.

You may ONLY recommend places from this hotel's curated list below — never suggest anything outside it:
${recLines || "(no recommendations on file yet)"}

Respond conversationally to the guest's message, then return which of the above (if any) you're recommending.
Return ONLY this exact JSON format, nothing else:
{
  "reply": "your conversational response",
  "recommendedIds": ["id1", "id2"]
}
recommendedIds must only contain ids from the list above, and can be empty if nothing specific applies.

Guest message: "${message}"`;
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

  const { hotelSlug, message } = body as Record<string, unknown>;
  if (typeof hotelSlug !== "string" || typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "hotelSlug and message are required" }, { status: 400 });
  }

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
    const result = await model.generateContent(buildPrompt(hotel, message.trim()));
    const raw = result.response.text();
    const cleaned = raw.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: { reply?: string; recommendedIds?: string[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { reply: raw.trim(), recommendedIds: [] };
    }

    const validIds = new Set(hotel.recs.map((r) => r.id));
    const recommendedIds = (parsed.recommendedIds ?? []).filter((id) => validIds.has(id));

    await recordEvent({
      type: "chat_message",
      hotelSlug,
      timestamp: new Date().toISOString(),
      data: { recommendedCount: recommendedIds.length },
    });

    return Response.json({ reply: parsed.reply ?? "", recommendedIds });
  } catch (err) {
    console.error("[chat] Gemini error:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Chat failed, try again" }, { status: 500 });
  }
}
