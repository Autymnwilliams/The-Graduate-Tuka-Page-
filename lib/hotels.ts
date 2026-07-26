import { readFile } from "fs/promises";
import path from "path";
import type { Hotel, PublicHotel, Rec } from "./types";
import { getRecStats } from "./recStats";

const HOTELS_DIR = path.join(process.cwd(), "data", "hotels");
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
 * Reads a hotel's full record from disk. Returns null for missing or
 * malformed slugs — never throws on a route param an attacker can control.
 */
export async function getHotelBySlug(slug: string): Promise<Hotel | null> {
  if (!isValidSlug(slug)) return null;

  try {
    const filePath = path.join(HOTELS_DIR, `${slug}.json`);
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as Hotel;
  } catch {
    return null;
  }
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
    visible.map(async (rec) => ({ ...rec, stats: await getRecStats(hotel.slug, rec.id) })),
  );

  return {
    id: hotel.id,
    slug: hotel.slug,
    name: hotel.name,
    neighborhood: hotel.neighborhood,
    logoUrl: hotel.logoUrl,
    heroImageUrl: hotel.heroImageUrl,
    coordinates: hotel.coordinates,
    welcomeMessage: hotel.welcomeMessage,
    categories: hotel.categories,
    visibleRecs,
    lockedCount,
    isUnlocked,
  };
}
