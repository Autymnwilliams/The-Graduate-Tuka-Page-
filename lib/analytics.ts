import { appendFile, mkdir } from "fs/promises";
import path from "path";
import type { AnalyticsEvent } from "./types";
import { getKv } from "./kv";

const EVENTS_FILE = path.join(process.cwd(), "data", "events.json");
const MAX_EVENTS_PER_HOTEL = 5000; // enough for a pilot's metrics view without the list growing unbounded

function analyticsKey(hotelSlug: string): string {
  return `analytics:${hotelSlug}`;
}

/**
 * Records one analytics event. Always logs to stdout (captured by Vercel's
 * function logs, exportable from the dashboard) and best-effort appends to
 * a local JSON-lines file (dev-time convenience — Vercel's production
 * filesystem is read-only/ephemeral outside /tmp). Also persists to the
 * same Mongo-or-in-memory KV store used by likes/reviews (lib/kv.ts) so the
 * staff metrics page has a real, queryable source instead of only stdout.
 */
export async function recordEvent(event: AnalyticsEvent): Promise<void> {
  const line = JSON.stringify(event);
  console.log(`[analytics] ${line}`);

  try {
    await mkdir(path.dirname(EVENTS_FILE), { recursive: true });
    await appendFile(EVENTS_FILE, line + "\n", "utf-8");
  } catch {
    // Best-effort only.
  }

  try {
    await getKv().rpush(analyticsKey(event.hotelSlug), line);
  } catch (err) {
    console.warn("[analytics] Failed to persist event to KV store:", err instanceof Error ? err.message : err);
  }
}

/** All persisted events for a hotel, oldest first — used by the staff metrics page. */
export async function getHotelEvents(hotelSlug: string): Promise<AnalyticsEvent[]> {
  const raw = await getKv().lrange(analyticsKey(hotelSlug), -MAX_EVENTS_PER_HOTEL, -1);
  return raw.map((entry) => JSON.parse(entry) as AnalyticsEvent);
}
