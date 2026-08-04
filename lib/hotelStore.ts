import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { MongoClient, type Collection } from "mongodb";
import type { Hotel, Rec } from "./types";

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
  staffNote?: string;
  staffName?: string;
}

export type RecPatch = Partial<Omit<NewRecInput, "lat" | "lng">> & { lat?: number; lng?: number };

interface HotelStore {
  getHotel(slug: string): Promise<Hotel | null>;
  addRec(slug: string, input: NewRecInput): Promise<Hotel | null>;
  updateRec(slug: string, recId: string, patch: RecPatch): Promise<Hotel | null>;
  deleteRec(slug: string, recId: string): Promise<Hotel | null>;
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
    bookingLink: patch.bookingLink !== undefined ? patch.bookingLink || undefined : rec.bookingLink,
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
}

/**
 * MongoDB-backed store. On first read of a slug with no doc yet, seeds from
 * data/hotels/${slug}.json — so /evanston and /hotelzachary keep working
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
