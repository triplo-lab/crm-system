import { NextRequest } from 'next/server'

// Types for monitoring
export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: Date
  tags?: Record<string, string>
}

export interface APIMetric {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: Date
  userAgent?: string
  ip?: string
  userId?: string
}

export interface CacheMetric {
  key: string
  operation: 'hit' | 'miss' | 'set' | 'delete'
  timestamp: Date
  ttl?: number
  size?: number
}

export interface ErrorMetric {
  error: string
  stack?: string
  endpoint?: string
  userId?: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// In-memory storage for metrics (in production, use Redis or database)
class MetricsStore {
  private performanceMetrics: PerformanceMetric[] = []
  private apiMetrics: APIMetric[] = []
  private cacheMetrics: CacheMetric[] = []
  private errorMetrics: ErrorMetric[] = []
  private maxSize = 10000 // Maximum metrics to keep in memory

  // Performance metrics
  addPerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }
    
    this.performanceMetrics.push(fullMetric)
    this.cleanup('performance')
  }

  getPerformanceMetrics(limit = 100): PerformanceMetric[] {
    return this.performanceMetrics.slice(-limit)
  }

  // API metrics
  addAPIMetric(metric: Omit<APIMetric, 'timestamp'>) {
    const fullMetric: APIMetric = {
      ...metric,
      timestamp: new Date()
    }
    
    this.apiMetrics.push(fullMetric)
    this.cleanup('api')
  }

  getAPIMetrics(limit = 100): APIMetric[] {
    return this.apiMetrics.slice(-limit)
  }

  // Cache metrics
  addCacheMetric(metric: Omit<CacheMetric, 'timestamp'>) {
    const fullMetric: CacheMetric = {
      ...metric,
      timestamp: new Date()
    }
    
    this.cacheMetrics.push(fullMetric)
    this.cleanup('cache')
  }

  getCacheMetrics(limit = 100): CacheMetric[] {
    return this.cacheMetrics.slice(-limit)
  }

  // Error metrics
  addErrorMetric(metric: Omit<ErrorMetric, 'timestamp'>) {
    const fullMetric: ErrorMetric = {
      ...metric,
      timestamp: new Date()
    }
    
    this.errorMetrics.push(fullMetric)
    this.cleanup('error')
  }

  getErrorMetrics(limit = 100): ErrorMetric[] {
    return this.errorMetrics.slice(-limit)
  }

  // Analytics and aggregations
  getAPIStats(timeRange = 3600000) { // Default 1 hour
    const cutoff = new Date(Date.now() - timeRange)
    const recentMetrics = this.apiMetrics.filter(m => m.timestamp > cutoff)
    
    const totalRequests = recentMetrics.length
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests || 0
    const errorRate = recentMetrics.filter(m => m.statusCode >= 400).length / totalRequests || 0
    
    const endpointStats = recentMetrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`
      if (!acc[key]) {
        acc[key] = { count: 0, totalTime: 0, errors: 0 }
      }
      acc[key].count++
      acc[key].totalTime += metric.responseTime
      if (metric.statusCode >= 400) acc[key].errors++
      return acc
    }, {} as Record<string, { count: number; totalTime: number; errors: number }>)

    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100),
      endpointStats: Object.entries(endpointStats).map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgResponseTime: Math.round(stats.totalTime / stats.count),
        errorRate: Math.round((stats.errors / stats.count) * 100)
      }))
    }
  }

  getCacheStats(timeRange = 3600000) {
    const cutoff = new Date(Date.now() - timeRange)
    const recentMetrics = this.cacheMetrics.filter(m => m.timestamp > cutoff)
    
    const hits = recentMetrics.filter(m => m.operation === 'hit').length
    const misses = recentMetrics.filter(m => m.operation === 'miss').length
    const total = hits + misses
    const hitRate = total > 0 ? (hits / total) * 100 : 0

    return {
      hits,
      misses,
      total,
      hitRate: Math.round(hitRate),
      operations: recentMetrics.reduce((acc, metric) => {
        acc[metric.operation] = (acc[metric.operation] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  getSystemHealth() {
    const now = Date.now()
    const oneHourAgo = now - 3600000
    
    const recentErrors = this.errorMetrics.filter(e => e.timestamp.getTime() > oneHourAgo)
    const criticalErrors = recentErrors.filter(e => e.severity === 'critical').length
    const recentAPI = this.apiMetrics.filter(m => m.timestamp.getTime() > oneHourAgo)
    const avgResponseTime = recentAPI.reduce((sum, m) => sum + m.responseTime, 0) / recentAPI.length || 0
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    if (criticalErrors > 0 || avgResponseTime > 5000) {
      status = 'critical'
    } else if (recentErrors.length > 10 || avgResponseTime > 2000) {
      status = 'warning'
    }

    return {
      status,
      avgResponseTime: Math.round(avgResponseTime),
      errorCount: recentErrors.length,
      criticalErrors,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    }
  }

  // Cleanup old metrics
  private cleanup(type: 'performance' | 'api' | 'cache' | 'error') {
    switch (type) {
      case 'performance':
        if (this.performanceMetrics.length > this.maxSize) {
          this.performanceMetrics = this.performanceMetrics.slice(-this.maxSize / 2)
        }
        break
      case 'api':
        if (this.apiMetrics.length > this.maxSize) {
          this.apiMetrics = this.apiMetrics.slice(-this.maxSize / 2)
        }
        break
      case 'cache':
        if (this.cacheMetrics.length > this.maxSize) {
          this.cacheMetrics = this.cacheMetrics.slice(-this.maxSize / 2)
        }
        break
      case 'error':
        if (this.errorMetrics.length > this.maxSize) {
          this.errorMetrics = this.errorMetrics.slice(-this.maxSize / 2)
        }
        break
    }
  }

  // Clear all metrics (for testing)
  clear() {
    this.performanceMetrics = []
    this.apiMetrics = []
    this.cacheMetrics = []
    this.errorMetrics = []
  }
}

// Global metrics store
export const metricsStore = new MetricsStore()

// Utility functions
export function trackAPICall(
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  request?: NextRequest,
  userId?: string
) {
  metricsStore.addAPIMetric({
    endpoint,
    method,
    statusCode,
    responseTime,
    userAgent: request?.headers.get('user-agent') || undefined,
    ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userId
  })
}

export function trackCacheOperation(
  key: string,
  operation: 'hit' | 'miss' | 'set' | 'delete',
  ttl?: number,
  size?: number
) {
  metricsStore.addCacheMetric({
    key,
    operation,
    ttl,
    size
  })
}

export function trackError(
  error: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  endpoint?: string,
  userId?: string,
  stack?: string
) {
  metricsStore.addErrorMetric({
    error,
    severity,
    endpoint,
    userId,
    stack
  })
}

export function trackPerformance(
  name: string,
  value: number,
  unit: string,
  tags?: Record<string, string>
) {
  metricsStore.addPerformanceMetric({
    name,
    value,
    unit,
    tags
  })
}

// Performance measurement utilities
export function measureTime<T>(fn: () => T, metricName: string): T {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  trackPerformance(metricName, duration, 'ms')
  return result
}

export async function measureAsyncTime<T>(
  fn: () => Promise<T>,
  metricName: string
): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  trackPerformance(metricName, duration, 'ms')
  return result
}
