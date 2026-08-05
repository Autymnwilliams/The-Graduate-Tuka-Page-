import { readFile } from "fs/promises";
import path from "path";
import type { Hotel } from "@/lib/types";
import { getHotelStore } from "@/lib/hotelStore";

/**
 * One-time maintenance endpoint, same pattern as sync-theme: pushes a
 * hotel's "coordinates" field from its data/hotels/${slug}.json seed file
 * onto its already-seeded store record. Needed after correcting imprecise
 * hotel-level coordinates (Graduate Evanston and Hilton Orrington were
 * even duplicated onto the exact same point) -- the store only seeds a
 * slug from disk once, so a JSON fix alone wouldn't reach an
 * already-seeded hotel.
 */
const SYNC_TOKEN = "28bc39e37a06cad3357af5146deaff17";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== SYNC_TOKEN) {
    return new Response("Not found", { status: 404 });
  }

  const hotelSlug = searchParams.get("hotel");
  if (!hotelSlug) return new Response("Missing ?hotel= param", { status: 400 });

  let seed: Hotel;
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "hotels", `${hotelSlug}.json`), "utf-8");
    seed = JSON.parse(raw) as Hotel;
  } catch {
    return new Response("Seed file not found", { status: 404 });
  }

  if (!seed.coordinates) return new Response("Seed file has no coordinates field", { status: 400 });

  const updated = await getHotelStore().setCoordinates(hotelSlug, seed.coordinates);
  if (!updated) return new Response("Hotel not found in store", { status: 404 });

  return new Response(`Synced coordinates for ${hotelSlug}: ${JSON.stringify(seed.coordinates)}`);
}
