import { useState, useEffect, useCallback, useRef } from 'react'
import { memoryCache } from '@/lib/cache'
import { trackCacheOperation } from '@/lib/monitoring'

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean // Return stale data while fetching fresh data
  retryOnError?: boolean // Retry on error
  maxRetries?: number // Maximum number of retries
}

interface CachedDataState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  isStale: boolean
}

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = true,
    retryOnError = true,
    maxRetries = 3
  } = options

  const [state, setState] = useState<CachedDataState<T>>({
    data: null,
    loading: true,
    error: null,
    isStale: false
  })

  const retryCountRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async (isBackground = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      if (!isBackground) {
        setState(prev => ({ ...prev, loading: true, error: null }))
      }

      const data = await fetcher()
      
      // Cache the data
      memoryCache.set(key, data, ttl)
      
      setState({
        data,
        loading: false,
        error: null,
        isStale: false
      })
      
      retryCountRef.current = 0
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Request was cancelled
      }

      const errorObj = error instanceof Error ? error : new Error('Unknown error')
      
      // Retry logic
      if (retryOnError && retryCountRef.current < maxRetries) {
        retryCountRef.current++
        setTimeout(() => fetchData(isBackground), 1000 * retryCountRef.current)
        return
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj
      }))
    }
  }, [key, fetcher, ttl, retryOnError, maxRetries])

  const revalidate = useCallback(() => {
    fetchData(false)
  }, [fetchData])

  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    setState(prev => {
      const data = typeof newData === 'function' 
        ? (newData as (prev: T | null) => T)(prev.data)
        : newData
      
      // Update cache
      memoryCache.set(key, data, ttl)
      
      return {
        ...prev,
        data,
        error: null,
        isStale: false
      }
    })
  }, [key, ttl])

  useEffect(() => {
    // Check cache first
    const cachedData = memoryCache.get(key)

    if (cachedData) {
      // Track cache hit
      trackCacheOperation(key, 'hit')

      setState({
        data: cachedData,
        loading: false,
        error: null,
        isStale: false
      })

      // If staleWhileRevalidate is enabled, fetch fresh data in background
      if (staleWhileRevalidate) {
        setState(prev => ({ ...prev, isStale: true }))
        fetchData(true)
      }
    } else {
      // Track cache miss
      trackCacheOperation(key, 'miss')
      fetchData(false)
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [key, fetchData, staleWhileRevalidate])

  return {
    ...state,
    revalidate,
    mutate
  }
}

// Specialized hooks for common data types
export function useCachedLeads(filters?: any) {
  const key = `leads-${JSON.stringify(filters || {})}`
  
  return useCachedData(
    key,
    async () => {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, String(value))
        })
      }
      
      const response = await fetch(`/api/leads?${params}`)
      if (!response.ok) throw new Error('Failed to fetch leads')
      return response.json()
    },
    { ttl: 2 * 60 * 1000 } // 2 minutes for leads
  )
}

export function useCachedClients(filters?: any) {
  const key = `clients-${JSON.stringify(filters || {})}`
  
  return useCachedData(
    key,
    async () => {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, String(value))
        })
      }
      
      const response = await fetch(`/api/clients?${params}`)
      if (!response.ok) throw new Error('Failed to fetch clients')
      return response.json()
    },
    { ttl: 5 * 60 * 1000 } // 5 minutes for clients
  )
}

export function useCachedDashboardStats() {
  return useCachedData(
    'dashboard-stats',
    async () => {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')
      return response.json()
    },
    { 
      ttl: 5 * 60 * 1000, // 5 minutes
      staleWhileRevalidate: true 
    }
  )
}

export function useCachedProposals(filters?: any) {
  const key = `proposals-${JSON.stringify(filters || {})}`
  
  return useCachedData(
    key,
    async () => {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, String(value))
        })
      }
      
      const response = await fetch(`/api/proposals?${params}`)
      if (!response.ok) throw new Error('Failed to fetch proposals')
      return response.json()
    },
    { ttl: 3 * 60 * 1000 } // 3 minutes for proposals
  )
}
