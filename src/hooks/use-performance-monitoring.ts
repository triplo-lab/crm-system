import { useEffect, useCallback, useRef } from 'react'

// Performance monitoring hook for frontend
export function usePerformanceMonitoring() {
  const metricsRef = useRef<{
    pageLoadTime?: number
    renderTime?: number
    interactionTime?: number
    memoryUsage?: number
  }>({})

  // Measure page load time
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
      metricsRef.current.pageLoadTime = loadTime
      
      // Send to monitoring API
      sendMetric('page_load_time', loadTime, 'ms')
    }
  }, [])

  // Measure component render time
  const measureRenderTime = useCallback((componentName: string) => {
    const start = performance.now()
    
    return () => {
      const renderTime = performance.now() - start
      metricsRef.current.renderTime = renderTime
      sendMetric(`${componentName}_render_time`, renderTime, 'ms')
    }
  }, [])

  // Measure user interaction time
  const measureInteraction = useCallback((interactionName: string) => {
    const start = performance.now()
    
    return () => {
      const interactionTime = performance.now() - start
      metricsRef.current.interactionTime = interactionTime
      sendMetric(`${interactionName}_interaction_time`, interactionTime, 'ms')
    }
  }, [])

  // Measure memory usage
  const measureMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      const memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize * 100
      metricsRef.current.memoryUsage = memoryUsage
      sendMetric('memory_usage', memoryUsage, 'percent')
    }
  }, [])

  // Send metric to backend
  const sendMetric = useCallback(async (name: string, value: number, unit: string) => {
    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'performance',
          metric: {
            name,
            value,
            unit,
            tags: {
              page: window.location.pathname,
              userAgent: navigator.userAgent,
            }
          }
        })
      })
    } catch (error) {
      console.warn('Failed to send performance metric:', error)
    }
  }, [])

  // Monitor Core Web Vitals
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Largest Contentful Paint (LCP)
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        sendMetric('lcp', lastEntry.startTime, 'ms')
      })
      
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        // Browser doesn't support LCP
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          sendMetric('fid', entry.processingStart - entry.startTime, 'ms')
        })
      })
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        // Browser doesn't support FID
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        sendMetric('cls', clsValue, 'score')
      })
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        // Browser doesn't support CLS
      }

      return () => {
        observer.disconnect()
        fidObserver.disconnect()
        clsObserver.disconnect()
      }
    }
  }, [sendMetric])

  return {
    measureRenderTime,
    measureInteraction,
    measureMemoryUsage,
    metrics: metricsRef.current
  }
}

// Hook for monitoring API calls
export function useAPIMonitoring() {
  const trackAPICall = useCallback(async (
    url: string,
    method: string,
    startTime: number,
    success: boolean,
    statusCode?: number
  ) => {
    const responseTime = performance.now() - startTime
    
    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'api',
          metric: {
            endpoint: url,
            method,
            statusCode: statusCode || (success ? 200 : 500),
            responseTime,
            userAgent: navigator.userAgent,
          }
        })
      })
    } catch (error) {
      console.warn('Failed to track API call:', error)
    }
  }, [])

  const monitoredFetch = useCallback(async (
    url: string,
    options?: RequestInit
  ): Promise<Response> => {
    const startTime = performance.now()
    const method = options?.method || 'GET'
    
    try {
      const response = await fetch(url, options)
      await trackAPICall(url, method, startTime, response.ok, response.status)
      return response
    } catch (error) {
      await trackAPICall(url, method, startTime, false)
      throw error
    }
  }, [trackAPICall])

  return {
    monitoredFetch,
    trackAPICall
  }
}

// Hook for error monitoring
export function useErrorMonitoring() {
  const trackError = useCallback(async (
    error: Error,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: Record<string, any>
  ) => {
    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'error',
          metric: {
            error: error.message,
            stack: error.stack,
            severity,
            endpoint: window.location.pathname,
            context: {
              userAgent: navigator.userAgent,
              url: window.location.href,
              timestamp: new Date().toISOString(),
              ...context
            }
          }
        })
      })
    } catch (e) {
      console.warn('Failed to track error:', e)
    }
  }, [])

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), 'high', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
      trackError(error, 'high', { type: 'unhandled_promise_rejection' })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [trackError])

  return {
    trackError
  }
}

// Combined monitoring hook
export function useMonitoring() {
  const performance = usePerformanceMonitoring()
  const api = useAPIMonitoring()
  const error = useErrorMonitoring()

  return {
    ...performance,
    ...api,
    ...error
  }
}
