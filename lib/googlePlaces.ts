import { MongoClient, type Collection } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const MAX_PHOTOS_PER_REC = 5;
// 30 days — business photo sets barely change, and the free tier only allows
// 100 Text Search calls/day, so every avoidable cache miss matters.
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

interface CacheEntry {
  photoNames: string[];
  expiresAt: number;
}

interface PhotoCacheDoc {
  _id: string;
  photoNames: string[];
  expiresAt: number;
}

/**
 * Persists resolved photo names across requests. Deliberately not an
 * in-memory Map: Vercel serverless functions cold-start constantly, which
 * was silently defeating the old in-memory cache and burning through the
 * daily Text Search quota on nearly every page view.
 */
interface PhotoCacheStore {
  get(key: string): Promise<CacheEntry | null>;
  set(key: string, entry: CacheEntry): Promise<void>;
}

class MemoryPhotoCacheStore implements PhotoCacheStore {
  private cache = new Map<string, CacheEntry>();

  async get(key: string) {
    return this.cache.get(key) ?? null;
  }

  async set(key: string, entry: CacheEntry) {
    this.cache.set(key, entry);
  }
}

class MongoPhotoCacheStore implements PhotoCacheStore {
  private ready: Promise<Collection<PhotoCacheDoc>>;

  constructor(uri: string) {
    const client = new MongoClient(uri);
    this.ready = client
      .connect()
      .then((c) => c.db())
      .then((db) => db.collection<PhotoCacheDoc>("places_photo_cache"));
  }

  async get(key: string) {
    const collection = await this.ready;
    const doc = await collection.findOne({ _id: key });
    return doc ? { photoNames: doc.photoNames, expiresAt: doc.expiresAt } : null;
  }

  async set(key: string, entry: CacheEntry) {
    const collection = await this.ready;
    await collection.updateOne(
      { _id: key },
      { $set: { photoNames: entry.photoNames, expiresAt: entry.expiresAt } },
      { upsert: true },
    );
  }
}

let cacheStore: PhotoCacheStore | null = null;

function getPhotoCacheStore(): PhotoCacheStore {
  if (cacheStore) return cacheStore;
  cacheStore = MONGODB_URI ? new MongoPhotoCacheStore(MONGODB_URI) : new MemoryPhotoCacheStore();
  return cacheStore;
}

interface TextSearchResponse {
  places?: { photos?: { name: string }[] }[];
}

/**
 * Returns null (not []) when the request itself failed — quota exceeded,
 * network error, bad key, etc. — so callers don't confuse "the API call
 * failed" with "this business genuinely has no photos" and cache a false
 * negative for a month.
 */
async function searchTextOnce(query: string): Promise<string[] | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;

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
    if (!res.ok) return null;

    const data = (await res.json()) as TextSearchResponse;
    return (data.places?.[0]?.photos ?? []).slice(0, MAX_PHOTOS_PER_REC).map((photo) => photo.name);
  } catch {
    return null;
  }
}

/** "123 Main St, Evanston, IL 60201" -> "Evanston, IL 60201" (whole string if there's no comma). */
function cityStateOf(address: string): string {
  const commaIndex = address.indexOf(",");
  return commaIndex >= 0 ? address.slice(commaIndex + 1).trim() : address;
}

/**
 * Resource names (e.g. "places/ABC123/photos/XYZ") of a business's
 * Google-hosted photos, via Places API (New) Text Search. Persistently
 * cached (see PhotoCacheStore above) since a business's photo set barely
 * changes and the daily quota is scarce. Returns [] when the API key isn't
 * configured, nothing matched, or the request fails — callers treat that as
 * "no Google photos available" and fall back gracefully, same as a missing
 * manual photo. A failed request is never written to the cache.
 *
 * Tries "name, full address" first; for landmarks/parks this sometimes
 * resolves to a generic address point with no photos instead of the actual
 * point-of-interest, so a broader "name, city/state" query is tried next.
 */
async function findPhotoResourceNames(name: string, address: string): Promise<string[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];

  const cacheKey = `${name}|${address}`;
  const cached = await getPhotoCacheStore().get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.photoNames;

  const first = await searchTextOnce(`${name}, ${address}`);
  if (first === null) return [];

  let photoNames = first;
  if (photoNames.length === 0) {
    const second = await searchTextOnce(`${name}, ${cityStateOf(address)}`);
    if (second === null) return [];
    photoNames = second;
  }

  await getPhotoCacheStore().set(cacheKey, { photoNames, expiresAt: Date.now() + CACHE_TTL_MS });
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
