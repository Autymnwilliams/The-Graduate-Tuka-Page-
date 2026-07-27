const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const MAX_PHOTOS_PER_REC = 5;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 1 week — business photo sets rarely change

interface CacheEntry {
  photoNames: string[];
  expiresAt: number;
}

const searchCache = new Map<string, CacheEntry>();

interface TextSearchResponse {
  places?: { photos?: { name: string }[] }[];
}

async function searchTextOnce(query: string): Promise<string[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.photos",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as TextSearchResponse;
    return (data.places?.[0]?.photos ?? []).slice(0, MAX_PHOTOS_PER_REC).map((photo) => photo.name);
  } catch {
    return [];
  }
}

/** "123 Main St, Evanston, IL 60201" -> "Evanston, IL 60201" (whole string if there's no comma). */
function cityStateOf(address: string): string {
  const commaIndex = address.indexOf(",");
  return commaIndex >= 0 ? address.slice(commaIndex + 1).trim() : address;
}

/**
 * Resource names (e.g. "places/ABC123/photos/XYZ") of a business's
 * Google-hosted photos, via Places API (New) Text Search. Cached in memory
 * per process since a business's photo set barely changes. Returns [] when
 * the API key isn't configured, nothing matched, or the request fails —
 * callers treat that as "no Google photos available" and fall back
 * gracefully, same as a missing manual photo.
 *
 * Tries "name, full address" first; for landmarks/parks this sometimes
 * resolves to a generic address point with no photos instead of the actual
 * point-of-interest, so a broader "name, city/state" query is tried next.
 */
async function findPhotoResourceNames(name: string, address: string): Promise<string[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];

  const cacheKey = `${name}|${address}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.photoNames;

  let photoNames = await searchTextOnce(`${name}, ${address}`);
  if (photoNames.length === 0) {
    photoNames = await searchTextOnce(`${name}, ${cityStateOf(address)}`);
  }

  searchCache.set(cacheKey, { photoNames, expiresAt: Date.now() + CACHE_TTL_MS });
  return photoNames;
}

/** How many Google-hosted photos are available for this business (0 if unconfigured/not found). */
export async function googlePhotoCount(name: string, address: string): Promise<number> {
  const photoNames = await findPhotoResourceNames(name, address);
  return photoNames.length;
}

export interface GooglePhoto {
  body: ReadableStream<Uint8Array>;
  contentType: string;
}

/** Fetches the raw bytes of the Nth Google-hosted photo for this business. Null if unavailable. */
export async function fetchGooglePhoto(
  name: string,
  address: string,
  index: number,
): Promise<GooglePhoto | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;

  const photoNames = await findPhotoResourceNames(name, address);
  const photoName = photoNames[index];
  if (!photoName) return null;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GOOGLE_PLACES_API_KEY}`,
    );
    if (!res.ok || !res.body) return null;

    return { body: res.body, contentType: res.headers.get("content-type") ?? "image/jpeg" };
  } catch {
    return null;
  }
}
