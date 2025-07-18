import { NextRequest, NextResponse } from 'next/server'
import { trackAPICall, trackError } from './monitoring'

// API monitoring wrapper
export function withMonitoring(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const start = performance.now()
    const endpoint = new URL(request.url).pathname
    const method = request.method
    
    try {
      const response = await handler(request, context)
      const responseTime = performance.now() - start
      
      // Track successful API call
      trackAPICall(
        endpoint,
        method,
        response.status,
        responseTime,
        request
      )
      
      return response
    } catch (error) {
      const responseTime = performance.now() - start
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const stack = error instanceof Error ? error.stack : undefined
      
      // Track error
      trackError(
        errorMessage,
        'high',
        endpoint,
        undefined,
        stack
      )
      
      // Track failed API call
      trackAPICall(
        endpoint,
        method,
        500,
        responseTime,
        request
      )
      
      // Re-throw error
      throw error
    }
  }
}

// Enhanced error tracking for API routes
export function trackAPIError(
  error: unknown,
  endpoint: string,
  userId?: string
) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const stack = error instanceof Error ? error.stack : undefined
  
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  
  // Determine severity based on error type
  if (errorMessage.includes('ECONNREFUSED') || 
      errorMessage.includes('Database') ||
      errorMessage.includes('FATAL')) {
    severity = 'critical'
  } else if (errorMessage.includes('Unauthorized') ||
             errorMessage.includes('Forbidden')) {
    severity = 'medium'
  } else if (errorMessage.includes('Not found') ||
             errorMessage.includes('Bad request')) {
    severity = 'low'
  } else {
    severity = 'high'
  }
  
  trackError(errorMessage, severity, endpoint, userId, stack)
}

// Performance monitoring for database operations
export async function monitorDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const start = performance.now()
  
  try {
    const result = await operation()
    const duration = performance.now() - start
    
    // Track successful database operation
    trackAPICall(
      `/db/${operationName}`,
      'DB',
      200,
      duration
    )
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    
    // Track failed database operation
    trackAPICall(
      `/db/${operationName}`,
      'DB',
      500,
      duration
    )
    
    trackAPIError(error, `/db/${operationName}`)
    throw error
  }
}

// Cache monitoring wrapper
export function monitorCacheOperation<T>(
  operation: () => T,
  cacheKey: string,
  operationType: 'get' | 'set' | 'delete'
): T {
  const start = performance.now()
  
  try {
    const result = operation()
    const duration = performance.now() - start
    
    // Track cache operation performance
    trackAPICall(
      `/cache/${operationType}`,
      'CACHE',
      200,
      duration
    )
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    
    trackAPICall(
      `/cache/${operationType}`,
      'CACHE',
      500,
      duration
    )
    
    trackAPIError(error, `/cache/${operationType}`)
    throw error
  }
}

// Request size monitoring
export function getRequestSize(request: NextRequest): number {
  const contentLength = request.headers.get('content-length')
  return contentLength ? parseInt(contentLength, 10) : 0
}

// Response size monitoring
export function getResponseSize(response: NextResponse): number {
  const contentLength = response.headers.get('content-length')
  return contentLength ? parseInt(contentLength, 10) : 0
}

// Rate limiting monitoring
export interface RateLimitInfo {
  ip: string
  endpoint: string
  count: number
  windowStart: number
  limit: number
}

class RateLimitMonitor {
  private requests = new Map<string, RateLimitInfo>()
  private windowSize = 60000 // 1 minute window
  
  checkRateLimit(
    ip: string,
    endpoint: string,
    limit: number = 100
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const key = `${ip}:${endpoint}`
    const now = Date.now()
    const windowStart = Math.floor(now / this.windowSize) * this.windowSize
    
    let info = this.requests.get(key)
    
    if (!info || info.windowStart !== windowStart) {
      info = {
        ip,
        endpoint,
        count: 0,
        windowStart,
        limit
      }
    }
    
    info.count++
    this.requests.set(key, info)
    
    const allowed = info.count <= limit
    const remaining = Math.max(0, limit - info.count)
    const resetTime = windowStart + this.windowSize
    
    if (!allowed) {
      trackError(
        `Rate limit exceeded for ${ip} on ${endpoint}`,
        'medium',
        endpoint
      )
    }
    
    return { allowed, remaining, resetTime }
  }
  
  cleanup() {
    const now = Date.now()
    const cutoff = now - this.windowSize * 2
    
    for (const [key, info] of this.requests.entries()) {
      if (info.windowStart < cutoff) {
        this.requests.delete(key)
      }
    }
  }
}

export const rateLimitMonitor = new RateLimitMonitor()

// Cleanup rate limit data every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    rateLimitMonitor.cleanup()
  }, 5 * 60 * 1000)
}

// Health check utilities
export function getSystemMetrics() {
  if (typeof process !== 'undefined') {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  }
  return null
}

// Alert thresholds
export const ALERT_THRESHOLDS = {
  RESPONSE_TIME_WARNING: 2000, // 2 seconds
  RESPONSE_TIME_CRITICAL: 5000, // 5 seconds
  ERROR_RATE_WARNING: 5, // 5%
  ERROR_RATE_CRITICAL: 10, // 10%
  MEMORY_WARNING: 0.8, // 80% of available memory
  MEMORY_CRITICAL: 0.9, // 90% of available memory
  CACHE_HIT_RATE_WARNING: 70, // 70%
  CACHE_HIT_RATE_CRITICAL: 50 // 50%
} as const

// Check if metrics exceed thresholds
export function checkAlertThresholds(stats: any) {
  const alerts: Array<{
    type: 'warning' | 'critical'
    message: string
    metric: string
    value: number
    threshold: number
  }> = []
  
  // Check response time
  if (stats.avgResponseTime > ALERT_THRESHOLDS.RESPONSE_TIME_CRITICAL) {
    alerts.push({
      type: 'critical',
      message: 'Average response time is critically high',
      metric: 'response_time',
      value: stats.avgResponseTime,
      threshold: ALERT_THRESHOLDS.RESPONSE_TIME_CRITICAL
    })
  } else if (stats.avgResponseTime > ALERT_THRESHOLDS.RESPONSE_TIME_WARNING) {
    alerts.push({
      type: 'warning',
      message: 'Average response time is high',
      metric: 'response_time',
      value: stats.avgResponseTime,
      threshold: ALERT_THRESHOLDS.RESPONSE_TIME_WARNING
    })
  }
  
  // Check error rate
  if (stats.errorRate > ALERT_THRESHOLDS.ERROR_RATE_CRITICAL) {
    alerts.push({
      type: 'critical',
      message: 'Error rate is critically high',
      metric: 'error_rate',
      value: stats.errorRate,
      threshold: ALERT_THRESHOLDS.ERROR_RATE_CRITICAL
    })
  } else if (stats.errorRate > ALERT_THRESHOLDS.ERROR_RATE_WARNING) {
    alerts.push({
      type: 'warning',
      message: 'Error rate is high',
      metric: 'error_rate',
      value: stats.errorRate,
      threshold: ALERT_THRESHOLDS.ERROR_RATE_WARNING
    })
  }
  
  return alerts
}
