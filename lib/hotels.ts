import type { Hotel, PublicHotel, Rec } from "./types";
import { getRecStats } from "./recStats";
import { googlePhotoCount } from "./googlePlaces";
import { getHotelStore } from "./hotelStore";

const SLUG_PATTERN = /^[a-z0-9-]+$/;

function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/** Featured recs first, otherwise original order preserved. */
function orderRecs(recs: Rec[]): Rec[] {
  return [...recs].sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured));
}

/** Whether a rec would be part of the free/unlocked visible set — used to gate direct links to a rec's own page. */
export function isRecVisible(hotel: Hotel, recId: string, isUnlocked: boolean): boolean {
  if (isUnlocked) return hotel.recs.some((rec) => rec.id === recId);
  const ordered = orderRecs(hotel.recs);
  return ordered.slice(0, hotel.freeRecLimit).some((rec) => rec.id === recId);
}

/**
 * Reads a hotel's full record. Returns null for missing or malformed slugs
 * — never throws on a route param an attacker can control. Backed by
 * lib/hotelStore.ts (MongoDB when configured, seeded from data/hotels/*.json
 * on first read; in-memory otherwise) rather than reading the JSON file
 * directly, so staff edits via the /staff pages persist.
 */
export async function getHotelBySlug(slug: string): Promise<Hotel | null> {
  if (!isValidSlug(slug)) return null;
  return getHotelStore().getHotel(slug);
}

/**
 * A rec's photos: manually-supplied ones win if present, otherwise falls
 * back to live Google Places photos (proxied through our own API route so
 * the Google API key never reaches the client). Resolves to [] — same as
 * "no photo yet" — when nothing is configured or found.
 */
export async function resolveRecPhotoUrls(hotelSlug: string, rec: Rec): Promise<string[]> {
  if (rec.photoUrls.length > 0) return rec.photoUrls;

  const count = await googlePhotoCount(rec.name, rec.address);
  return Array.from({ length: count }, (_, i) => `/api/rec-photo/${hotelSlug}/${rec.id}/${i}`);
}

/**
 * Shapes a hotel record for client consumption. When locked, recs beyond
 * freeRecLimit are dropped entirely (not just hidden) so the gate can't be
 * bypassed by reading page source or client-side state. Attaches live
 * like/review stats per visible rec.
 */
export async function toPublicHotel(hotel: Hotel, isUnlocked: boolean): Promise<PublicHotel> {
  const ordered = orderRecs(hotel.recs);
  const visible = isUnlocked ? ordered : ordered.slice(0, hotel.freeRecLimit);
  const lockedCount = isUnlocked ? 0 : Math.max(ordered.length - hotel.freeRecLimit, 0);

  const visibleRecs = await Promise.all(
    visible.map(async (rec) => ({
      ...rec,
      photoUrls: await resolveRecPhotoUrls(hotel.slug, rec),
      stats: await getRecStats(hotel.slug, rec.id),
    })),
  );

  return {
    id: hotel.id,
    slug: hotel.slug,
    name: hotel.name,
    neighborhood: hotel.neighborhood,
    logoUrl: hotel.logoUrl,
    heroImageUrl: hotel.heroImageUrl,
    coordinates: hotel.coordinates,
    categories: hotel.categories,
    visibleRecs,
    lockedCount,
    isUnlocked,
  };
}
