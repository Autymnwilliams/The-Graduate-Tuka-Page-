import { readFile } from "fs/promises";
import path from "path";
import type { Hotel, PublicHotel, Rec } from "./types";

const HOTELS_DIR = path.join(process.cwd(), "data", "hotels");
const SLUG_PATTERN = /^[a-z0-9-]+$/;

function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/** Featured recs first, otherwise original order preserved. */
function orderRecs(recs: Rec[]): Rec[] {
  return [...recs].sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured));
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
 * bypassed by reading page source or client-side state.
 */
export function toPublicHotel(hotel: Hotel, isUnlocked: boolean): PublicHotel {
  const ordered = orderRecs(hotel.recs);
  const visibleRecs = isUnlocked ? ordered : ordered.slice(0, hotel.freeRecLimit);
  const lockedCount = isUnlocked ? 0 : Math.max(ordered.length - hotel.freeRecLimit, 0);

  return {
    id: hotel.id,
    slug: hotel.slug,
    name: hotel.name,
    neighborhood: hotel.neighborhood,
    logoUrl: hotel.logoUrl,
    heroImageUrl: hotel.heroImageUrl,
    brandColors: hotel.brandColors,
    coordinates: hotel.coordinates,
    welcomeMessage: hotel.welcomeMessage,
    categories: hotel.categories,
    visibleRecs,
    lockedCount,
    isUnlocked,
  };
}
