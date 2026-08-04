import { getHotelStore } from "@/lib/hotelStore";

/**
 * One-time maintenance endpoint: drops a hotel's stored record so the next
 * read reseeds it fresh from data/hotels/${slug}.json. Needed because the
 * store only seeds a slug from disk on its very first read — any edits made
 * to the JSON file after that (new recs, theme, etc.) are otherwise invisible
 * until something forces a reseed. Delete this route once it's served its
 * purpose.
 */
const RESET_TOKEN = "8fd867d0f6cd4f546ef0831617daf078";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== RESET_TOKEN) {
    return new Response("Not found", { status: 404 });
  }

  const hotelSlug = searchParams.get("hotel");
  if (!hotelSlug) return new Response("Missing ?hotel= param", { status: 400 });

  const store = getHotelStore();
  await store.resetHotel(hotelSlug);
  const reseeded = await store.getHotel(hotelSlug);

  if (!reseeded) return new Response(`No seed file found for "${hotelSlug}"`, { status: 404 });

  return new Response(
    `Reseeded ${hotelSlug}: ${reseeded.recs.length} recs, first is "${reseeded.recs[0]?.name}"`,
  );
}
