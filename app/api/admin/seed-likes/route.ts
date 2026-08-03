import { getHotelBySlug } from "@/lib/hotels";
import { getKv } from "@/lib/kv";

/**
 * One-time maintenance endpoint to seed demo like-counts on a hotel's recs.
 * Not a real credential — just a guard against random requests hitting it.
 * Delete this route once it's served its purpose.
 */
const SEED_TOKEN = "288086867d74d82ab521337ad7102931";

const MIN_LIKES = 20;
const MAX_LIKES = 30;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== SEED_TOKEN) {
    return new Response("Not found", { status: 404 });
  }

  const hotelSlug = searchParams.get("hotel") ?? "hotelzachary";
  const hotel = await getHotelBySlug(hotelSlug);
  if (!hotel) return new Response("Hotel not found", { status: 404 });

  const kv = getKv();
  const lines: string[] = [];

  for (const rec of hotel.recs) {
    const key = `likes:${hotelSlug}:${rec.id}:guests`;
    const target = randomInt(MIN_LIKES, MAX_LIKES);
    const before = await kv.scard(key);

    if (before >= target) {
      lines.push(`${rec.name}: already ${before}, skipped`);
      continue;
    }

    const needed = target - before;
    const newMembers = Array.from(
      { length: needed },
      (_, i) => `seed-guest-${rec.id}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    );
    await kv.saddMany(key, newMembers);
    lines.push(`${rec.name}: ${before} -> ${target}`);
  }

  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain" } });
}
