import { Redis } from "@upstash/redis";

const REST_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Minimal subset of Redis commands this app needs, so the rest of the code
 * doesn't care whether it's talking to real Upstash or the in-memory stand-in.
 */
interface KvClient {
  rpush(key: string, value: string): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  sadd(key: string, member: string): Promise<number>;
  srem(key: string, member: string): Promise<number>;
  sismember(key: string, member: string): Promise<boolean>;
  scard(key: string): Promise<number>;
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
}

class UpstashKv implements KvClient {
  constructor(private redis: Redis) {}

  async rpush(key: string, value: string) {
    return this.redis.rpush(key, value);
  }

  async lrange(key: string, start: number, stop: number) {
    return this.redis.lrange<string>(key, start, stop);
  }

  async sadd(key: string, member: string) {
    return this.redis.sadd(key, member);
  }

  async srem(key: string, member: string) {
    return this.redis.srem(key, member);
  }

  async sismember(key: string, member: string) {
    const result = await this.redis.sismember(key, member);
    return result === 1;
  }

  async scard(key: string) {
    return this.redis.scard(key);
  }
}

let client: KvClient | null = null;

/**
 * Real Upstash Redis when KV_REST_API_URL/TOKEN (or UPSTASH_REDIS_REST_*) are
 * configured; an in-memory stand-in otherwise. The in-memory version resets on
 * every server restart/cold start — fine for local dev, not meant for
 * production. Set up Vercel KV (or an Upstash database) before launch.
 */
export function getKv(): KvClient {
  if (client) return client;

  if (REST_URL && REST_TOKEN) {
    client = new UpstashKv(new Redis({ url: REST_URL, token: REST_TOKEN }));
  } else {
    console.warn(
      "[kv] KV_REST_API_URL/TOKEN not set — using in-memory storage that resets on restart. Fine for local dev, not for production.",
    );
    client = new MemoryKv();
  }
  return client;
}
