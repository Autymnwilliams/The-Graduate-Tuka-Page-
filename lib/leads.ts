import { MongoClient, type Collection } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

export interface Lead {
  email: string;
  name: string;
  /** E.164 phone, used for the concierge SMS (lib/sms.ts) triggered from likes. */
  phone?: string;
  /** Free-text answer to "How long is your stay?" -- used to personalize the concierge SMS. */
  stayLength?: string;
  /** Guest cookie id (lib/guest.ts), so the likes route can look up a phone number by guestId. */
  guestId?: string;
  hotelSlug: string;
  firstSignedUpAt: string;
  lastSignedUpAt: string;
}

export interface UpsertLeadInput {
  email: string;
  name: string;
  phone?: string;
  stayLength?: string;
  guestId?: string;
  hotelSlug: string;
}

interface LeadStore {
  /** Upserts by email (case-insensitive). Returns whether this email had already signed up before. */
  upsertLead(input: UpsertLeadInput): Promise<{ isReturning: boolean }>;
  /** Looks up a lead by guest cookie id — used by the likes route to personalize the concierge SMS. */
  getLeadByGuestId(guestId: string): Promise<Lead | null>;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

class MemoryLeadStore implements LeadStore {
  private leads = new Map<string, Lead>();

  async upsertLead({ email, name, phone, stayLength, guestId, hotelSlug }: UpsertLeadInput) {
    const key = normalizeEmail(email);
    const existing = this.leads.get(key);
    const now = new Date().toISOString();

    this.leads.set(key, {
      email: key,
      name: name || existing?.name || "",
      phone: phone || existing?.phone,
      stayLength: stayLength || existing?.stayLength,
      guestId: guestId || existing?.guestId,
      hotelSlug,
      firstSignedUpAt: existing?.firstSignedUpAt ?? now,
      lastSignedUpAt: now,
    });

    return { isReturning: existing !== undefined };
  }

  async getLeadByGuestId(guestId: string) {
    for (const lead of this.leads.values()) {
      if (lead.guestId === guestId && lead.phone) return lead;
    }
    return null;
  }
}

class MongoLeadStore implements LeadStore {
  private ready: Promise<Collection<Lead>>;

  constructor(uri: string) {
    const client = new MongoClient(uri);
    this.ready = client
      .connect()
      .then((c) => c.db())
      .then((db) => db.collection<Lead>("leads"));
  }

  async upsertLead({ email, name, phone, stayLength, guestId, hotelSlug }: UpsertLeadInput) {
    const key = normalizeEmail(email);
    const leads = await this.ready;
    const now = new Date().toISOString();

    const existing = await leads.findOne({ email: key });
    await leads.updateOne(
      { email: key },
      {
        $set: {
          name: name || existing?.name || "",
          phone: phone || existing?.phone,
          stayLength: stayLength || existing?.stayLength,
          guestId: guestId || existing?.guestId,
          hotelSlug,
          lastSignedUpAt: now,
        },
        $setOnInsert: { email: key, firstSignedUpAt: now },
      },
      { upsert: true },
    );

    return { isReturning: existing !== null };
  }

  async getLeadByGuestId(guestId: string) {
    const leads = await this.ready;
    return leads.findOne({ guestId, phone: { $exists: true, $ne: "" } });
  }
}

let store: LeadStore | null = null;

/** Real MongoDB when MONGODB_URI is configured; an in-memory stand-in otherwise (mirrors lib/kv.ts). */
export function getLeadStore(): LeadStore {
  if (store) return store;

  if (MONGODB_URI) {
    store = new MongoLeadStore(MONGODB_URI);
  } else {
    console.warn(
      "[leads] MONGODB_URI not set — using in-memory lead storage that resets on restart. Fine for local dev, not for production.",
    );
    store = new MemoryLeadStore();
  }
  return store;
}
