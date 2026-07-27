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

/**
 * Resource names (e.g. "places/ABC123/photos/XYZ") of a business's
 * Google-hosted photos, via Places API (New) Text Search. Cached in memory
 * per process since a business's photo set barely changes. Returns [] when
 * the API key isn't configured, nothing matched, or the request fails —
 * callers treat that as "no Google photos available" and fall back
 * gracefully, same as a missing manual photo.
 */
async function findPhotoResourceNames(query: string): Promise<string[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];

  const cached = searchCache.get(query);
  if (cached && cached.expiresAt > Date.now()) return cached.photoNames;

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
    const photoNames = (data.places?.[0]?.photos ?? [])
      .slice(0, MAX_PHOTOS_PER_REC)
      .map((photo) => photo.name);

    searchCache.set(query, { photoNames, expiresAt: Date.now() + CACHE_TTL_MS });
    return photoNames;
  } catch {
    return [];
  }
}

function recQuery(name: string, address: string): string {
  return `${name}, ${address}`;
}

/** How many Google-hosted photos are available for this business (0 if unconfigured/not found). */
export async function googlePhotoCount(name: string, address: string): Promise<number> {
  const photoNames = await findPhotoResourceNames(recQuery(name, address));
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

  const photoNames = await findPhotoResourceNames(recQuery(name, address));
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
