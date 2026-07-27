import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { getHotelBySlug } from "@/lib/hotels";
import { GUEST_ID_COOKIE, GUEST_ID_COOKIE_MAX_AGE_SECONDS } from "@/lib/guest";
import { toggleLike } from "@/lib/likes";
import { recordEvent } from "@/lib/analytics";

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

  const { hotelSlug, recId } = body as Record<string, unknown>;
  if (typeof hotelSlug !== "string" || typeof recId !== "string") {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const hotel = await getHotelBySlug(hotelSlug);
  const recExists = hotel?.recs.some((rec) => rec.id === recId) ?? false;
  if (!hotel || !recExists) {
    return Response.json({ error: "Rec not found" }, { status: 404 });
  }

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

  const { liked, count } = await toggleLike(hotelSlug, recId, guestId);

  await recordEvent({
    type: "rec_liked",
    hotelSlug,
    timestamp: new Date().toISOString(),
    data: { recId, liked },
  });

  return Response.json({ liked, count });
}
