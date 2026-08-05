import { MongoClient, type Collection } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Minimal subset of Redis-style commands this app needs, so the rest of the
 * code doesn't care whether it's talking to real MongoDB or the in-memory
 * stand-in.
 */
interface KvClient {
  rpush(key: string, value: string): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  sadd(key: string, member: string): Promise<number>;
  saddMany(key: string, members: string[]): Promise<number>;
  srem(key: string, member: string): Promise<number>;
  sismember(key: string, member: string): Promise<boolean>;
  scard(key: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  /** Deletes every list key starting with prefix. Used to invalidate stale cached matches (e.g. lib/resy.ts's venue cache) after a matching-logic change. */
  delByPrefix(prefix: string): Promise<number>;
}

class MemoryKv implements KvClient {
  private lists = new Map<string, string[]>();
  private sets = new Map<string, Set<string>>();

  async rpush(key: string, value: string) {
    const list = this.lists.get(key) ?? [];
    list.push(value);
    this.lists.set(key, list);
    return list.length;
  }

  async lrange(key: string, start: number, stop: number) {
    const list = this.lists.get(key) ?? [];
    const end = stop === -1 ? list.length : stop + 1;
    return list.slice(start, end);
  }

  async sadd(key: string, member: string) {
    const set = this.sets.get(key) ?? new Set<string>();
    const added = set.has(member) ? 0 : 1;
    set.add(member);
    this.sets.set(key, set);
    return added;
  }

  async saddMany(key: string, members: string[]) {
    const set = this.sets.get(key) ?? new Set<string>();
    let added = 0;
    for (const member of members) {
      if (!set.has(member)) added++;
      set.add(member);
    }
    this.sets.set(key, set);
    return added;
  }

  async srem(key: string, member: string) {
    const set = this.sets.get(key);
    if (!set || !set.has(member)) return 0;
    set.delete(member);
    return 1;
  }

  async sismember(key: string, member: string) {
    return this.sets.get(key)?.has(member) ?? false;
  }

  async scard(key: string) {
    return this.sets.get(key)?.size ?? 0;
  }

  async smembers(key: string) {
    return [...(this.sets.get(key) ?? [])];
  }

  async delByPrefix(prefix: string) {
    let count = 0;
    for (const key of [...this.lists.keys()]) {
      if (key.startsWith(prefix)) {
        this.lists.delete(key);
        count++;
      }
    }
    return count;
  }
}

interface KvDoc {
  _id: string;
  values: string[];
}

class MongoKv implements KvClient {
  private listsReady: Promise<Collection<KvDoc>>;
  private setsReady: Promise<Collection<KvDoc>>;

  constructor(uri: string) {
    const client = new MongoClient(uri);
    const connected = client.connect().then(() => client.db());
    this.listsReady = connected.then((db) => db.collection<KvDoc>("kv_lists"));
    this.setsReady = connected.then((db) => db.collection<KvDoc>("kv_sets"));
  }

  async rpush(key: string, value: string) {
    const lists = await this.listsReady;
    const result = await lists.findOneAndUpdate(
      { _id: key },
      { $push: { values: value } },
      { upsert: true, returnDocument: "after" },
    );
    return result?.values.length ?? 1;
  }

  async lrange(key: string, start: number, stop: number) {
    const lists = await this.listsReady;
    const doc = await lists.findOne({ _id: key });
    const values = doc?.values ?? [];
    const end = stop === -1 ? values.length : stop + 1;
    return values.slice(start, end);
  }

  async sadd(key: string, member: string) {
    const sets = await this.setsReady;
    const result = await sets.updateOne(
      { _id: key },
      { $addToSet: { values: member } },
      { upsert: true },
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0 ? 1 : 0;
  }

  async saddMany(key: string, members: string[]) {
    if (members.length === 0) return 0;
    const sets = await this.setsReady;
    const before = await sets.findOne({ _id: key });
    const beforeCount = before?.values.length ?? 0;

    await sets.updateOne(
      { _id: key },
      { $addToSet: { values: { $each: members } } },
      { upsert: true },
    );

    const after = await sets.findOne({ _id: key });
    return (after?.values.length ?? 0) - beforeCount;
  }

  async srem(key: string, member: string) {
    const sets = await this.setsReady;
    const result = await sets.updateOne({ _id: key }, { $pull: { values: member } });
    return result.modifiedCount > 0 ? 1 : 0;
  }

  async sismember(key: string, member: string) {
    const sets = await this.setsReady;
    const doc = await sets.findOne({ _id: key, values: member });
    return doc !== null;
  }

  async scard(key: string) {
    const sets = await this.setsReady;
    const doc = await sets.findOne({ _id: key });
    return doc?.values.length ?? 0;
  }

  async smembers(key: string) {
    const sets = await this.setsReady;
    const doc = await sets.findOne({ _id: key });
    return doc?.values ?? [];
  }

  async delByPrefix(prefix: string) {
    const lists = await this.listsReady;
    const result = await lists.deleteMany({ _id: { $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` } });
    return result.deletedCount;
  }
}

let client: KvClient | null = null;

/**
 * Real MongoDB when MONGODB_URI is configured; an in-memory stand-in
 * otherwise. The in-memory version resets on every server restart/cold
 * start — fine for local dev, not meant for production. Set up a MongoDB
 * Atlas (free tier is plenty for a pilot) database before launch.
 */
export function getKv(): KvClient {
  if (client) return client;

  if (MONGODB_URI) {
    client = new MongoKv(MONGODB_URI);
  } else {
    console.warn(
      "[kv] MONGODB_URI not set — using in-memory storage that resets on restart. Fine for local dev, not for production.",
    );
    client = new MemoryKv();
  }
  return client;
}
