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
  url_slug?: string;
  venue_url_slug?: string;
  location?: { locality?: string; region?: string; url_slug?: string };
}

interface ResyVenueMatch {
  venueId: number;
  /** Resy's own canonical page for this venue -- real, not a guess, since Resy itself just told us this is the right listing. */
  venueUrl: string;
}

/**
 * Resy's canonical URL is /cities/<city-slug>/<venue-slug>. The city slug
 * follows the "<city>-<state>" convention (e.g. "new-york-ny"). Prefer the
 * hit's own location.url_slug when present; otherwise derive a best-effort
 * slug from locality + region. Same formula as the resy-mcp reference
 * implementation this integration was originally validated against.
 */
function deriveVenueUrl(hit: ResyVenueHit): string | null {
  const slug = hit.url_slug ?? hit.venue_url_slug;
  if (!slug) return null;

  const citySlug =
    hit.location?.url_slug ??
    (hit.location?.locality && hit.location?.region
      ? `${hit.location.locality.toLowerCase().replace(/\s+/g, "-")}-${hit.location.region.toLowerCase().replace(/\s+/g, "-")}`
      : "new-york-ny");

  return `https://resy.com/cities/${citySlug}/${slug}`;
}

/** Runs the venue search + confidence check once per rec, cached indefinitely (rarely changes). Shared by searchResyVenue and getResyVenueUrl so both draw from the same cached lookup instead of double-searching. */
async function resolveResyVenue(recId: string, name: string, lat: number, lng: number): Promise<ResyVenueMatch | null> {
  // lrange(-1, -1) reads the MOST RECENT push -- rpush only appends, so
  // reading index 0 would always return the first-ever write, not the
  // latest cache entry.
  const cached = await getKv().lrange(VENUE_CACHE_KEY(recId), -1, -1);
  if (cached.length > 0) {
    const parsed = JSON.parse(cached[0]) as { match: ResyVenueMatch | null };
    return parsed.match;
  }

  let match: ResyVenueMatch | null = null;
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
      if (hit?.id?.resy) {
        const venueUrl = deriveVenueUrl(hit);
        if (venueUrl) match = { venueId: hit.id.resy, venueUrl };
      }
    }
  } catch (err) {
    console.warn("[resy] Venue search failed:", err instanceof Error ? err.message : err);
  }

  // Cache the miss too (as null) so we don't re-search every request for recs Resy doesn't have.
  await getKv().rpush(VENUE_CACHE_KEY(recId), JSON.stringify({ match }));
  return match;
}

/** Resolves a rec to a Resy venue_id for slot lookups. Returns null on no confident match or any request failure. */
export async function searchResyVenue(recId: string, name: string, lat: number, lng: number): Promise<number | null> {
  const match = await resolveResyVenue(recId, name, lat, lng);
  return match?.venueId ?? null;
}

/** Resy's own canonical page for a rec's matched venue, for the reservation button -- real, never a guessed URL. Null if no confident match. */
export async function getResyVenueUrl(recId: string, name: string, lat: number, lng: number): Promise<string | null> {
  const match = await resolveResyVenue(recId, name, lat, lng);
  return match?.venueUrl ?? null;
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
