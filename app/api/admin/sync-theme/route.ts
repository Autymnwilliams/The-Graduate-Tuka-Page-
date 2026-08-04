import { readFile } from "fs/promises";
import path from "path";
import type { Hotel } from "@/lib/types";
import { getHotelStore } from "@/lib/hotelStore";

/**
 * One-time maintenance endpoint: pushes a hotel's "theme" field from its
 * data/hotels/${slug}.json seed file onto its already-seeded store record.
 * Needed because the store only seeds a slug from disk on its very first
 * read — hotels that were already seeded before "theme" existed won't pick
 * up a newly-added theme automatically. Delete this route once it's served
 * its purpose.
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

  if (!seed.theme) return new Response("Seed file has no theme field", { status: 400 });

  const updated = await getHotelStore().setTheme(hotelSlug, seed.theme);
  if (!updated) return new Response("Hotel not found in store", { status: 404 });

  return new Response(`Synced theme for ${hotelSlug}: ${JSON.stringify(seed.theme)}`);
}
