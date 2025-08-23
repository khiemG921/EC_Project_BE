/**
 * Flexible code store used for OTPs / temp tokens.
 * Tries to use Redis when REDIS_URL is provided and `redis` package is available.
 * Falls back to in-process NodeCache otherwise (not shared between instances).
 * API: async set(key, value, ttlSeconds), async get(key), async del(key)
 */
const DEFAULT_TTL = 120; // seconds

let impl = null;

async function initRedis(url) {
  try {
    const { createClient } = require('redis');
    const client = createClient({ url });
    client.on('error', (err) => console.error('Redis client error:', err));
    await client.connect();
    return {
      set: async (k, v, ttl = DEFAULT_TTL) => {
        await client.set(k, JSON.stringify(v), { EX: ttl });
      },
      get: async (k) => {
        const raw = await client.get(k);
        if (!raw) return undefined;
        try { return JSON.parse(raw); } catch (e) { return undefined; }
      },
      del: async (k) => { await client.del(k); },
      has: async (k) => { const r = await client.exists(k); return !!r; }
    };
  } catch (e) {
    console.warn('Redis not available or connection failed, falling back to NodeCache. Reason:', e.message || e);
    return null;
  }
}

function initNodeCache() {
  const NodeCache = require('node-cache');
  const cache = new NodeCache();
  return {
    set: async (k, v, ttl = DEFAULT_TTL) => cache.set(k, v, ttl),
    get: async (k) => cache.get(k),
    del: async (k) => cache.del(k),
    has: async (k) => cache.has(k)
  };
}

async function getImpl() {
  if (impl) return impl;
  if (process.env.REDIS_URL) {
    impl = await initRedis(process.env.REDIS_URL);
    if (impl) return impl;
  }
  impl = initNodeCache();
  return impl;
}

module.exports = {
  set: async (k, v, ttl) => {
    const i = await getImpl();
    return i.set(k, v, ttl);
  },
  get: async (k) => {
    const i = await getImpl();
    return i.get(k);
  },
  del: async (k) => {
    const i = await getImpl();
    return i.del(k);
  },
  has: async (k) => {
    const i = await getImpl();
    return i.has(k);
  }
};
