import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { MongoClient, type Collection } from "mongodb";
import type { Hotel, Rec } from "./types";
import type { HotelTheme } from "./theme";

const MONGODB_URI = process.env.MONGODB_URI;
const HOTELS_DIR = path.join(process.cwd(), "data", "hotels");

/** Reads a hotel's ORIGINAL seed data straight off disk — used only to seed the store on first read. */
async function readSeedFile(slug: string): Promise<Hotel | null> {
  try {
    const raw = await readFile(path.join(HOTELS_DIR, `${slug}.json`), "utf-8");
    return JSON.parse(raw) as Hotel;
  } catch {
    return null;
  }
}

export interface NewRecInput {
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  shortDescription: string;
  priceLevel: string;
  tags: string[];
  bookingLink?: string;
  hours?: string;
  staffNote?: string;
  staffName?: string;
}

export type RecPatch = Partial<Omit<NewRecInput, "lat" | "lng">> & { lat?: number; lng?: number; photoUrls?: string[] };

interface HotelStore {
  getHotel(slug: string): Promise<Hotel | null>;
  addRec(slug: string, input: NewRecInput): Promise<Hotel | null>;
  updateRec(slug: string, recId: string, patch: RecPatch): Promise<Hotel | null>;
  deleteRec(slug: string, recId: string): Promise<Hotel | null>;
  setTheme(slug: string, theme: HotelTheme): Promise<Hotel | null>;
  /** Same "already-seeded, need to push a corrected field" need as setTheme -- for the hotel's own coordinates. */
  setCoordinates(slug: string, coordinates: Hotel["coordinates"]): Promise<Hotel | null>;
  /** Drops the stored record so the next getHotel() reseeds fresh from data/hotels/${slug}.json. */
  resetHotel(slug: string): Promise<void>;
  /**
   * Non-destructive counterpart to resetHotel: fills in bookingLink (by rec
   * id) from data/hotels/${slug}.json wherever the stored rec's bookingLink
   * is currently empty, and leaves everything else -- staff-added recs,
   * uploaded photos, edited fields -- untouched. Needed because the store
   * only seeds a hotel from disk once; JSON edits made after that first
   * seed (like the bulk bookingLink additions) are otherwise invisible.
   */
  backfillBookingLinks(slug: string): Promise<{ updated: number }>;
  /** Same non-destructive backfill pattern as backfillBookingLinks, for the `hours` field. */
  backfillHours(slug: string): Promise<{ updated: number }>;
}

function buildRec(input: NewRecInput): Rec {
  return {
    id: randomUUID(),
    name: input.name,
    category: input.category,
    coordinates: { lat: input.lat, lng: input.lng },
    address: input.address,
    photoUrls: [],
    shortDescription: input.shortDescription,
    priceLevel: input.priceLevel,
    tags: input.tags,
    bookingLink: input.bookingLink || undefined,
    hours: input.hours || undefined,
    staffNote: input.staffNote || undefined,
    staffName: input.staffName || undefined,
  };
}

function applyPatch(rec: Rec, patch: RecPatch): Rec {
  return {
    ...rec,
    name: patch.name ?? rec.name,
    category: patch.category ?? rec.category,
    address: patch.address ?? rec.address,
    coordinates:
      patch.lat !== undefined && patch.lng !== undefined
        ? { lat: patch.lat, lng: patch.lng }
        : rec.coordinates,
    shortDescription: patch.shortDescription ?? rec.shortDescription,
    priceLevel: patch.priceLevel ?? rec.priceLevel,
    tags: patch.tags ?? rec.tags,
    photoUrls: patch.photoUrls ?? rec.photoUrls,
    bookingLink: patch.bookingLink !== undefined ? patch.bookingLink || undefined : rec.bookingLink,
    hours: patch.hours !== undefined ? patch.hours || undefined : rec.hours,
    staffNote: patch.staffNote !== undefined ? patch.staffNote || undefined : rec.staffNote,
    staffName: patch.staffName !== undefined ? patch.staffName || undefined : rec.staffName,
  };
}

/**
 * In-memory stand-in — mirrors lib/leads.ts's fallback pattern. Resets on
 * every restart/cold start; fine for local dev, not production.
 */
class MemoryHotelStore implements HotelStore {
  private hotels = new Map<string, Hotel>();

  async getHotel(slug: string): Promise<Hotel | null> {
    if (!this.hotels.has(slug)) {
      const seed = await readSeedFile(slug);
      if (seed) this.hotels.set(slug, seed);
    }
    return this.hotels.get(slug) ?? null;
  }

  async addRec(slug: string, input: NewRecInput): Promise<Hotel | null> {
    const hotel = await this.getHotel(slug);
    if (!hotel) return null;
    hotel.recs.push(buildRec(input));
    return hotel;
  }

  async updateRec(slug: string, recId: string, patch: RecPatch): Promise<Hotel | null> {
    const hotel = await this.getHotel(slug);
    if (!hotel) return null;
    const idx = hotel.recs.findIndex((r) => r.id === recId);
    if (idx === -1) return null;
    hotel.recs[idx] = applyPatch(hotel.recs[idx], patch);
    return hotel;
  }

  async deleteRec(slug: string, recId: string): Promise<Hotel | null> {
    const hotel = await this.getHotel(slug);
    if (!hotel) return null;
    hotel.recs = hotel.recs.filter((r) => r.id !== recId);
    return hotel;
  }

  async setTheme(slug: string, theme: HotelTheme): Promise<Hotel | null> {
    const hotel = await this.getHotel(slug);
    if (!hotel) return null;
    hotel.theme = theme;
    return hotel;
  }

  async setCoordinates(slug: string, coordinates: Hotel["coordinates"]): Promise<Hotel | null> {
    const hotel = await this.getHotel(slug);
    if (!hotel) return null;
    hotel.coordinates = coordinates;
    return hotel;
  }

  async resetHotel(slug: string): Promise<void> {
    this.hotels.delete(slug);
  }

  async backfillBookingLinks(slug: string): Promise<{ updated: number }> {
    const hotel = await this.getHotel(slug);
    const seed = await readSeedFile(slug);
    if (!hotel || !seed) return { updated: 0 };

    const seedById = new Map(seed.recs.map((r) => [r.id, r]));
    let updated = 0;
    for (const rec of hotel.recs) {
      const seedRec = seedById.get(rec.id);
      if (!rec.bookingLink && seedRec?.bookingLink) {
        rec.bookingLink = seedRec.bookingLink;
        updated++;
      }
    }
    return { updated };
  }

  async backfillHours(slug: string): Promise<{ updated: number }> {
    const hotel = await this.getHotel(slug);
    const seed = await readSeedFile(slug);
    if (!hotel || !seed) return { updated: 0 };

    const seedById = new Map(seed.recs.map((r) => [r.id, r]));
    let updated = 0;
    for (const rec of hotel.recs) {
      const seedRec = seedById.get(rec.id);
      if (!rec.hours && seedRec?.hours) {
        rec.hours = seedRec.hours;
        updated++;
      }
    }
    return { updated };
  }
}

/**
 * MongoDB-backed store. On first read of a slug with no doc yet, seeds from
 * data/hotels/${slug}.json — so existing hotel pages keep working
 * unchanged the moment this ships, no manual migration step required.
 */
class MongoHotelStore implements HotelStore {
  private ready: Promise<Collection<Hotel>>;

  constructor(uri: string) {
    const client = new MongoClient(uri);
    this.ready = client
      .connect()
      .then((c) => c.db())
      .then((db) => db.collection<Hotel>("hotels"));
  }

  async getHotel(slug: string): Promise<Hotel | null> {
    const hotels = await this.ready;
    const existing = await hotels.findOne({ slug }, { projection: { _id: 0 } });
    if (existing) return existing;

    const seed = await readSeedFile(slug);
    if (!seed) return null;

    // Race-safe: another concurrent request may seed first — upsert either way.
    await hotels.updateOne({ slug }, { $setOnInsert: seed }, { upsert: true });
    return (await hotels.findOne({ slug }, { projection: { _id: 0 } })) ?? seed;
  }

  async addRec(slug: string, input: NewRecInput): Promise<Hotel | null> {
    const hotel = await this.getHotel(slug);
    if (!hotel) return null;
    const rec = buildRec(input);
    const hotels = await this.ready;
    await hotels.updateOne({ slug }, { $push: { recs: rec } });
    hotel.recs.push(rec);
    return hotel;
  }

  async updateRec(slug: string, recId: string, patch: RecPatch): Promise<Hotel | null> {
    const hotel = await this.getHotel(slug);
    if (!hotel) return null;
    const idx = hotel.recs.findIndex((r) => r.id === recId);
    if (idx === -1) return null;

    const updated = applyPatch(hotel.recs[idx], patch);
    hotel.recs[idx] = updated;

    const hotels = await this.ready;
    await hotels.updateOne({ slug, "recs.id": recId }, { $set: { "recs.$": updated } });
    return hotel;
  }

  async deleteRec(slug: string, recId: string): Promise<Hotel | null> {
    const hotel = await this.getHotel(slug);
    if (!hotel) return null;
    hotel.recs = hotel.recs.filter((r) => r.id !== recId);

    const hotels = await this.ready;
    await hotels.updateOne({ slug }, { $pull: { recs: { id: recId } } });
    return hotel;
  }

  async setTheme(slug: string, theme: HotelTheme): Promise<Hotel | null> {
    const hotel = await this.getHotel(slug);
    if (!hotel) return null;
    hotel.theme = theme;

    const hotels = await this.ready;
    await hotels.updateOne({ slug }, { $set: { theme } });
    return hotel;
  }

  async setCoordinates(slug: string, coordinates: Hotel["coordinates"]): Promise<Hotel | null> {
    const hotel = await this.getHotel(slug);
    if (!hotel) return null;
    hotel.coordinates = coordinates;

    const hotels = await this.ready;
    await hotels.updateOne({ slug }, { $set: { coordinates } });
    return hotel;
  }

  async resetHotel(slug: string): Promise<void> {
    const hotels = await this.ready;
    await hotels.deleteOne({ slug });
  }

  async backfillBookingLinks(slug: string): Promise<{ updated: number }> {
    const hotel = await this.getHotel(slug);
    const seed = await readSeedFile(slug);
    if (!hotel || !seed) return { updated: 0 };

    const seedById = new Map(seed.recs.map((r) => [r.id, r]));
    let updated = 0;
    for (const rec of hotel.recs) {
      const seedRec = seedById.get(rec.id);
      if (!rec.bookingLink && seedRec?.bookingLink) {
        rec.bookingLink = seedRec.bookingLink;
        updated++;
      }
    }
    if (updated === 0) return { updated: 0 };

    // Single whole-array write of the in-JS-merged recs -- safe because
    // `hotel` above came from this same getHotel() call, so it already
    // reflects any staff-added recs/edits; this only changed the
    // bookingLink fields that were empty.
    const hotels = await this.ready;
    await hotels.updateOne({ slug }, { $set: { recs: hotel.recs } });
    return { updated };
  }

  async backfillHours(slug: string): Promise<{ updated: number }> {
    const hotel = await this.getHotel(slug);
    const seed = await readSeedFile(slug);
    if (!hotel || !seed) return { updated: 0 };

    const seedById = new Map(seed.recs.map((r) => [r.id, r]));
    let updated = 0;
    for (const rec of hotel.recs) {
      const seedRec = seedById.get(rec.id);
      if (!rec.hours && seedRec?.hours) {
        rec.hours = seedRec.hours;
        updated++;
      }
    }
    if (updated === 0) return { updated: 0 };

    const hotels = await this.ready;
    await hotels.updateOne({ slug }, { $set: { recs: hotel.recs } });
    return { updated };
  }
}

let store: HotelStore | null = null;

/** Real MongoDB when MONGODB_URI is configured; an in-memory stand-in otherwise (mirrors lib/kv.ts / lib/leads.ts). */
export function getHotelStore(): HotelStore {
  if (store) return store;

  if (MONGODB_URI) {
    store = new MongoHotelStore(MONGODB_URI);
  } else {
    console.warn(
      "[hotelStore] MONGODB_URI not set — using in-memory hotel/rec storage that resets on restart. Fine for local dev, not for production.",
    );
    store = new MemoryHotelStore();
  }
  return store;
}
