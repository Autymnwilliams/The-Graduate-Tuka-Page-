import { getHotelBySlug } from "@/lib/hotels";
import { getReviews, addSeedReviews, type SeedReview } from "@/lib/reviews";
import { FAKE_REVIEWER_NAMES, FAKE_STAY_LENGTHS, reviewTemplatesFor } from "@/lib/reviewTemplates";

/**
 * One-time maintenance endpoint to seed demo reviews on a hotel's recs.
 * Not a real credential — just a guard against random requests hitting it.
 * Delete this route once it's served its purpose.
 */
const SEED_TOKEN = "434668c92c3bbc932285185d4bc55077";

const MIN_REVIEWS = 3;
const MAX_REVIEWS = 7;
const MAX_DAYS_AGO = 150;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function weightedRating(): number {
  const roll = Math.random();
  if (roll < 0.5) return 5;
  if (roll < 0.85) return 4;
  return 3;
}

function randomPastDate(daysAgoMax: number): string {
  const daysAgo = randomInt(1, daysAgoMax);
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== SEED_TOKEN) {
    return new Response("Not found", { status: 404 });
  }

  const hotelSlug = searchParams.get("hotel") ?? "orrington";
  const hotel = await getHotelBySlug(hotelSlug);
  if (!hotel) return new Response("Hotel not found", { status: 404 });

  const lines: string[] = [];

  for (const rec of hotel.recs) {
    const existing = await getReviews(hotelSlug, rec.id);
    if (existing.length > 0) {
      lines.push(`${rec.name}: already has ${existing.length}, skipped`);
      continue;
    }

    const count = randomInt(MIN_REVIEWS, MAX_REVIEWS);
    const names = shuffled(FAKE_REVIEWER_NAMES).slice(0, count);
    const templates = reviewTemplatesFor(rec.category);
    const dates = Array.from({ length: count }, () => randomPastDate(MAX_DAYS_AGO)).sort();

    const reviews: SeedReview[] = names.map((guestName, i) => ({
      guestName,
      rating: weightedRating(),
      text: pickOne(templates).replace(/\{name\}/g, rec.name),
      stayLength: pickOne(FAKE_STAY_LENGTHS),
      createdAt: dates[i],
    }));

    await addSeedReviews(hotelSlug, rec.id, reviews);
    lines.push(`${rec.name}: added ${count} reviews`);
  }

  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain" } });
}
