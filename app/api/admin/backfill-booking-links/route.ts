import { getHotelStore } from "@/lib/hotelStore";

/**
 * One-time maintenance endpoint: non-destructive counterpart to
 * reset-hotel. Fills in bookingLink from data/hotels/${slug}.json for any
 * rec whose stored bookingLink is currently empty, without touching
 * anything else (staff-added recs, uploaded photos, edited fields). Delete
 * this route once it's served its purpose.
 */
const RESET_TOKEN = "8fd867d0f6cd4f546ef0831617daf078";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== RESET_TOKEN) {
    return new Response("Not found", { status: 404 });
  }

  const hotelSlug = searchParams.get("hotel");
  if (!hotelSlug) return new Response("Missing ?hotel= param", { status: 400 });

  const { updated } = await getHotelStore().backfillBookingLinks(hotelSlug);
  return new Response(`Backfilled bookingLink on ${updated} rec(s) for "${hotelSlug}"`);
}
