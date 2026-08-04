import { getKv } from "./kv";

/**
 * Real Resy availability — opt-in via ENABLE_REAL_AVAILABILITY, off by
 * default. Resy doesn't publish an official API; this calls the same
 * private endpoints resy.com's own browser JS calls, using ONLY their
 * public, non-secret web-app API key (baked into resy.com's JS, sent on
 * every unauthenticated request) -- no login, no user credentials. Verified
 * live against api.resy.com while building this. Still an unofficial,
 * undocumented endpoint outside any published API -- Resy's ToS covers
 * automated use in general, so this stays behind the env flag and always
 * falls back to lib/availability.ts's simulated calendar on any failure or
 * low-confidence match. Not a hard dependency anywhere.
 */

const BASE_URL = "https://api.resy.com";
const DEFAULT_API_KEY = "VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"; // Resy's public web-app key, not a secret
const API_KEY = process.env.RESY_API_KEY || DEFAULT_API_KEY;

const HEADERS = {
  Authorization: `ResyAPI api_key="${API_KEY}"`,
  Origin: "https://resy.com",
  Referer: "https://resy.com/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
} as const;

const VENUE_CACHE_KEY = (recId: string) => `resy:venue:${recId}`;
const SLOTS_CACHE_KEY = (venueId: number, date: string) => `resy:slots:${venueId}:${date}`;
const SLOTS_TTL_MS = 15 * 60 * 1000;

export function isRealAvailabilityEnabled(): boolean {
  return process.env.ENABLE_REAL_AVAILABILITY === "true";
}

function normalize(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4);
}

/** Only treat a search hit as "the same restaurant" if they share a distinctive word — guards against confidently showing the wrong venue's availability. */
function isConfidentMatch(recName: string, hitName: string): boolean {
  const recTokens = new Set(normalize(recName));
  const hitTokens = normalize(hitName);
  return hitTokens.some((t) => recTokens.has(t));
}

interface ResyVenueHit {
  id?: { resy?: number };
  name?: string;
}

/** Resolves a rec to a Resy venue_id, cached indefinitely per rec (rarely changes). Returns null on no confident match or any request failure. */
export async function searchResyVenue(recId: string, name: string, lat: number, lng: number): Promise<number | null> {
  // lrange(-1, -1) reads the MOST RECENT push -- rpush only appends, so
  // reading index 0 would always return the first-ever write, not the
  // latest cache entry.
  const cached = await getKv().lrange(VENUE_CACHE_KEY(recId), -1, -1);
  if (cached.length > 0) {
    const parsed = JSON.parse(cached[0]) as { venueId: number | null };
    return parsed.venueId;
  }

  let venueId: number | null = null;
  try {
    const struct = {
      availability: false,
      page: 1,
      per_page: 5,
      types: ["venue"],
      geo: { latitude: lat, longitude: lng, radius: 3000 },
      query: name,
    };
    const res = await fetch(`${BASE_URL}/3/venuesearch/search`, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ struct_data: JSON.stringify(struct) }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = (await res.json()) as { search?: { hits?: ResyVenueHit[] } };
      const hit = (data.search?.hits ?? []).find((h) => h.id?.resy && h.name && isConfidentMatch(name, h.name));
      venueId = hit?.id?.resy ?? null;
    }
  } catch (err) {
    console.warn("[resy] Venue search failed:", err instanceof Error ? err.message : err);
  }

  // Cache the miss too (as null) so we don't re-search every request for recs Resy doesn't have.
  await getKv().rpush(VENUE_CACHE_KEY(recId), JSON.stringify({ venueId }));
  return venueId;
}

interface ResySlot {
  date?: { start?: string };
}

/**
 * Real available time labels (e.g. "7:00 PM") for one venue on one date,
 * cached ~15 min. Resy's API only returns bookable slots -- there's no
 * concept of an explicit "taken" slot to report, so this returns just the
 * open times; the caller renders them directly rather than trying to plot
 * them onto the simulated fixed-grid (real reservation times don't line up
 * with any guessed grid, so forcing a match would misreport real
 * availability as unavailable). Returns null on any failure/timeout so the
 * caller falls back to the simulated grid for just that day.
 */
export async function getResySlots(venueId: number, lat: number, lng: number, date: string): Promise<string[] | null> {
  const cacheKey = SLOTS_CACHE_KEY(venueId, date);
  const cached = await getKv().lrange(cacheKey, -1, -1);
  if (cached.length > 0) {
    const parsed = JSON.parse(cached[0]) as { fetchedAt: number; times: string[] };
    if (Date.now() - parsed.fetchedAt < SLOTS_TTL_MS) return parsed.times;
  }

  try {
    const params = new URLSearchParams({
      lat: String(lat),
      long: String(lng),
      day: date,
      party_size: "2",
      venue_id: String(venueId),
    });
    const res = await fetch(`${BASE_URL}/4/find?${params.toString()}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { results?: { venues?: Array<{ slots?: ResySlot[] }> } };
    const rawSlots = data.results?.venues?.[0]?.slots ?? [];
    const times = rawSlots
      .map((s) => s.date?.start)
      .filter((start): start is string => !!start)
      .map((start) => new Date(start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));

    await getKv().rpush(cacheKey, JSON.stringify({ fetchedAt: Date.now(), times }));
    return times;
  } catch (err) {
    console.warn("[resy] Slot fetch failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
