import { randomUUID } from "crypto";
import { getKv } from "./kv";
import type { Review } from "./types";

const MAX_REVIEW_TEXT_LENGTH = 2000;
const MAX_GUEST_NAME_LENGTH = 80;
const MAX_STAY_LENGTH_LENGTH = 40;

function reviewsKey(hotelSlug: string, recId: string): string {
  return `reviews:${hotelSlug}:${recId}`;
}

export interface NewReview {
  hotelSlug: string;
  recId: string;
  guestName: string;
  rating: number;
  text: string;
  stayLength?: string;
}

export async function addReview(input: NewReview): Promise<Review> {
  const review: Review = {
    id: randomUUID(),
    hotelSlug: input.hotelSlug,
    recId: input.recId,
    guestName: input.guestName.trim().slice(0, MAX_GUEST_NAME_LENGTH),
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    text: input.text.trim().slice(0, MAX_REVIEW_TEXT_LENGTH),
    stayLength: input.stayLength?.trim().slice(0, MAX_STAY_LENGTH_LENGTH) || undefined,
    createdAt: new Date().toISOString(),
  };

  await getKv().rpush(reviewsKey(input.hotelSlug, input.recId), JSON.stringify(review));
  return review;
}

export interface SeedReview {
  guestName: string;
  rating: number;
  text: string;
  stayLength?: string;
  createdAt: string;
}

/**
 * Appends a batch of pre-built reviews in one round-trip (vs. one per
 * addReview call) — used only by the demo-data seeding endpoint. Callers
 * pass createdAt directly (rather than "now") so seeded reviews can be
 * staggered across realistic-looking dates.
 */
export async function addSeedReviews(
  hotelSlug: string,
  recId: string,
  reviews: SeedReview[],
): Promise<void> {
  if (reviews.length === 0) return;

  const serialized = reviews.map((r) =>
    JSON.stringify({
      id: randomUUID(),
      hotelSlug,
      recId,
      guestName: r.guestName.trim().slice(0, MAX_GUEST_NAME_LENGTH),
      rating: Math.min(5, Math.max(1, Math.round(r.rating))),
      text: r.text.trim().slice(0, MAX_REVIEW_TEXT_LENGTH),
      stayLength: r.stayLength?.trim().slice(0, MAX_STAY_LENGTH_LENGTH) || undefined,
      createdAt: r.createdAt,
    } satisfies Review),
  );

  await getKv().rpushMany(reviewsKey(hotelSlug, recId), serialized);
}

/** Newest first. */
export async function getReviews(hotelSlug: string, recId: string): Promise<Review[]> {
  const raw = await getKv().lrange(reviewsKey(hotelSlug, recId), 0, -1);
  const reviews = raw.map((entry) => JSON.parse(entry) as Review);
  return reviews.reverse();
}

export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
}
