import { getKv } from "@/lib/kv";

/**
 * One-time maintenance endpoint: clears every cached Resy venue match
 * (lib/resy.ts caches indefinitely by design, since matches rarely
 * change). Needed after tightening isConfidentMatch/adding the category
 * gate, since stale cached false-positive matches (e.g. "Bombastic Cafe"
 * matched to "Cafe Yaya") would otherwise keep being served from cache
 * forever, bypassing the fixed logic entirely. Delete this route once
 * it's served its purpose.
 */
const RESET_TOKEN = "8fd867d0f6cd4f546ef0831617daf078";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== RESET_TOKEN) {
    return new Response("Not found", { status: 404 });
  }

  const cleared = await getKv().delByPrefix("resy:venue:");
  return new Response(`Cleared ${cleared} cached Resy venue match(es)`);
}
