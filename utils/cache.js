// In-Memory Cache (Works on Windows without Redis)
const cache = new Map();

// Helper function to manage expiration
const setExpiration = (key, expiration) => {
  if (expiration > 0) {
    setTimeout(() => {
      cache.delete(key);
      console.log(`🗑️ Cache expired: ${key}`);
    }, expiration * 1000);
  }
};

// Initialize Redis if available, otherwise use in-memory cache
let redisClient = null;
let useRedis = false;

const connectRedis = async () => {
  try {
    const redis = require('redis');
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      socket: { reconnectStrategy: () => false } // Disable auto-reconnect attempts
    });

    let errorLogged = false;
    redisClient.on('error', (err) => {
      if (!errorLogged) {
        console.log('⚠️ Redis unavailable. Using in-memory cache:', err.message);
        errorLogged = true;
      }
      useRedis = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Connected Successfully!');
      useRedis = true;
    });

    await redisClient.connect().catch(() => {
      useRedis = false;
    });
  } catch (error) {
    console.log('⚠️ Redis not available. Using in-memory cache:', error.message);
    useRedis = false;
  }
};

// Get from cache
const getCache = async (key) => {
  try {
    // Try Redis first if available
    if (useRedis && redisClient) {
      try {
        const value = await redisClient.get(key);
        if (value) {
          console.log(`📦 Cache HIT (Redis): ${key}`);
          return JSON.parse(value);
        }
      } catch (err) {
        console.log('Redis get error, falling back to memory:', err.message);
      }
    }

    // Fall back to in-memory cache
    if (cache.has(key)) {
      console.log(`📦 Cache HIT (Memory): ${key}`);
      return cache.get(key);
    }

    console.log(`❌ Cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.log('Cache get error:', error.message);
    return null;
  }
};

// Set cache with expiration (default 10 minutes)
const setCache = async (key, value, expiration = 600) => {
  try {
    const data = JSON.parse(JSON.stringify(value)); // Deep copy

    // Try Redis first if available
    if (useRedis && redisClient) {
      try {
        await redisClient.setEx(key, expiration, JSON.stringify(data));
        console.log(`💾 Cached (Redis): ${key} [${expiration}s]`);
        return;
      } catch (err) {
        console.log('Redis set error, falling back to memory:', err.message);
      }
    }

    // Fall back to in-memory cache
    cache.set(key, data);
    setExpiration(key, expiration);
    console.log(`💾 Cached (Memory): ${key} [${expiration}s]`);
  } catch (error) {
    console.log('Cache set error:', error.message);
  }
};

// Delete cache
const deleteCache = async (key) => {
  try {
    if (useRedis && redisClient) {
      try {
        await redisClient.del(key);
      } catch (err) {
        console.log('Redis delete error:', err.message);
      }
    }
    cache.delete(key);
    console.log(`🗑️ Cleared cache: ${key}`);
  } catch (error) {
    console.log('Cache delete error:', error.message);
  }
};

// Delete multiple cache keys by pattern
const deleteCachePattern = async (pattern) => {
  try {
    const regex = new RegExp(pattern.replace('*', '.*'));

    // Clear Redis if available
    if (useRedis && redisClient) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
          console.log(`🗑️ Cleared ${keys.length} Redis cache keys matching: ${pattern}`);
        }
      } catch (err) {
        console.log('Redis delete pattern error:', err.message);
      }
    }

    // Clear memory cache
    let cleared = 0;
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
        cleared++;
      }
    }
    if (cleared > 0) {
      console.log(`🗑️ Cleared ${cleared} memory cache keys matching: ${pattern}`);
    }
  } catch (error) {
    console.log('Cache delete pattern error:', error.message);
  }
};

// Clear all cache
const clearCache = async () => {
  try {
    if (useRedis && redisClient) {
      try {
        await redisClient.flushDb();
      } catch (err) {
        console.log('Redis clear error:', err.message);
      }
    }
    cache.clear();
    console.log('🗑️ All cache cleared');
  } catch (error) {
    console.log('Cache clear error:', error.message);
  }
};

// Get cache stats
const getCacheStats = () => {
  return {
    cacheSize: cache.size,
    useRedis,
    redisConnected: useRedis && redisClient ? true : false
  };
};

module.exports = {
  connectRedis,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  clearCache,
  getCacheStats
};
