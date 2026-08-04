import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { getHotelBySlug } from "@/lib/hotels";
import { getLeadStore } from "@/lib/leads";
import { GUEST_ID_COOKIE, GUEST_ID_COOKIE_MAX_AGE_SECONDS } from "@/lib/guest";
import { sendSms } from "@/lib/sms";

/**
 * Chat-to-SMS handoff: "Prefer texting? Enter your number to continue this
 * conversation by SMS" — the web chat widget stays available either way,
 * this just also texts the guest so they can continue there if they'd
 * rather. One-way (concierge sends a continuation text), not a full
 * bidirectional SMS conversation loop.
 */
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

  const { hotelSlug, phone } = body as Record<string, unknown>;
  if (typeof hotelSlug !== "string" || typeof phone !== "string" || !phone.trim()) {
    return Response.json({ error: "hotelSlug and phone are required" }, { status: 400 });
  }

  const hotel = await getHotelBySlug(hotelSlug);
  if (!hotel) {
    return Response.json({ error: "Hotel not found" }, { status: 404 });
  }

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

  // No email yet at this point (guest hasn't necessarily signed up) -- key
  // the lead by a synthetic placeholder tied to guestId so getPhoneByGuestId
  // still resolves this phone for the favorite-triggered concierge SMS later.
  await getLeadStore().upsertLead({
    email: `guest-${guestId}@no-email.tuka`,
    name: "",
    phone: phone.trim(),
    guestId,
    hotelSlug,
  });

  try {
    await sendSms(phone.trim(), `Hey! Continuing our chat from ${hotel.name} — what are you in the mood for?`);
  } catch (err) {
    console.warn("[chat/handoff] SMS send failed:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Could not send text" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
