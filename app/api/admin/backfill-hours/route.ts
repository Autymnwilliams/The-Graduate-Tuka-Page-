import { getHotelStore } from "@/lib/hotelStore";

/**
 * One-time maintenance endpoint, same non-destructive pattern as
 * backfill-booking-links: re-reads data/hotels/${slug}.json and fills in
 * `hours` for any rec whose stored value is currently empty, without
 * touching anything else. Needed for the same reason -- the store only
 * seeds a hotel from disk once, so hours added to the JSON after that
 * first seed would otherwise never reach an already-seeded hotel.
 */
const RESET_TOKEN = "8fd867d0f6cd4f546ef0831617daf078";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== RESET_TOKEN) {
    return new Response("Not found", { status: 404 });
  }

  const hotelSlug = searchParams.get("hotel");
  if (!hotelSlug) return new Response("Missing ?hotel= param", { status: 400 });

  const { updated } = await getHotelStore().backfillHours(hotelSlug);
  return new Response(`Backfilled hours on ${updated} rec(s) for "${hotelSlug}"`);
}
