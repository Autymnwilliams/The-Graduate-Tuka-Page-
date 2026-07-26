import { cookies } from "next/headers";
import { getHotelBySlug } from "@/lib/hotels";
import { unlockCookieName } from "@/lib/unlock";
import { addReview } from "@/lib/reviews";
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

  const { hotelSlug, recId, guestName, rating, text, stayLength } = body as Record<
    string,
    unknown
  >;

  if (
    typeof hotelSlug !== "string" ||
    typeof recId !== "string" ||
    typeof guestName !== "string" ||
    typeof rating !== "number" ||
    typeof text !== "string" ||
    !guestName.trim() ||
    !text.trim() ||
    !Number.isFinite(rating) ||
    rating < 1 ||
    rating > 5 ||
    (stayLength !== undefined && typeof stayLength !== "string")
  ) {
    return Response.json({ error: "Invalid review" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get(unlockCookieName(hotelSlug))?.value === "1";
  if (!isUnlocked) {
    return Response.json({ error: "Sign up before leaving a review" }, { status: 403 });
  }

  const hotel = await getHotelBySlug(hotelSlug);
  const recExists = hotel?.recs.some((rec) => rec.id === recId) ?? false;
  if (!hotel || !recExists) {
    return Response.json({ error: "Rec not found" }, { status: 404 });
  }

  const review = await addReview({
    hotelSlug,
    recId,
    guestName,
    rating,
    text,
    stayLength: typeof stayLength === "string" ? stayLength : undefined,
  });

  await recordEvent({
    type: "review_submitted",
    hotelSlug,
    timestamp: new Date().toISOString(),
    data: { recId, rating },
  });

  return Response.json({ review });
}
