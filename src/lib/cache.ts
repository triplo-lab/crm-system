import { unstable_cache } from 'next/cache'
import { trackCacheOperation } from './monitoring'

// Cache configuration
const CACHE_TAGS = {
  LEADS: 'leads',
  CLIENTS: 'clients', 
  PROJECTS: 'projects',
  PROPOSALS: 'proposals',
  USERS: 'users',
  DASHBOARD_STATS: 'dashboard-stats'
} as const

const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  VERY_LONG: 3600 // 1 hour
} as const

// Generic cache wrapper
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  tags: string[],
  revalidate: number = CACHE_DURATIONS.MEDIUM
) {
  return unstable_cache(
    fn,
    [keyPrefix],
    {
      tags,
      revalidate
    }
  )
}

// Specific cache functions for different data types
export const cacheLeads = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  revalidate: number = CACHE_DURATIONS.SHORT
) => createCachedFunction(fn, `leads-${keyPrefix}`, [CACHE_TAGS.LEADS], revalidate)

export const cacheClients = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  revalidate: number = CACHE_DURATIONS.MEDIUM
) => createCachedFunction(fn, `clients-${keyPrefix}`, [CACHE_TAGS.CLIENTS], revalidate)

export const cacheProjects = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  revalidate: number = CACHE_DURATIONS.MEDIUM
) => createCachedFunction(fn, `projects-${keyPrefix}`, [CACHE_TAGS.PROJECTS], revalidate)

export const cacheProposals = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  revalidate: number = CACHE_DURATIONS.MEDIUM
) => createCachedFunction(fn, `proposals-${keyPrefix}`, [CACHE_TAGS.PROPOSALS], revalidate)

export const cacheDashboardStats = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  revalidate: number = CACHE_DURATIONS.LONG
) => createCachedFunction(fn, `dashboard-${keyPrefix}`, [CACHE_TAGS.DASHBOARD_STATS], revalidate)

// Cache invalidation helpers
export const CACHE_TAGS_EXPORT = CACHE_TAGS
export const CACHE_DURATIONS_EXPORT = CACHE_DURATIONS

// Helper to generate cache keys
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('-')
  
  return `${prefix}-${sortedParams}`
}

// Memory cache for very frequent requests (client-side)
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // Track cache set operation
    trackCacheOperation(key, 'set', ttl, JSON.stringify(data).length)
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)

    if (!item) {
      // Track cache miss
      trackCacheOperation(key, 'miss')
      return null
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      // Track cache miss (expired)
      trackCacheOperation(key, 'miss')
      return null
    }

    // Track cache hit
    trackCacheOperation(key, 'hit')
    return item.data
  }
  
  delete(key: string): void {
    this.cache.delete(key)
    // Track cache delete operation
    trackCacheOperation(key, 'delete')
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  // Clean expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const memoryCache = new MemoryCache()

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup()
  }, 5 * 60 * 1000)
}
