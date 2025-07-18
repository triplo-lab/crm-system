import { metricsStore } from './monitoring'
import { ALERT_THRESHOLDS, checkAlertThresholds } from './api-monitoring'

// Alert types
export interface Alert {
  id: string
  type: 'warning' | 'critical'
  title: string
  message: string
  metric: string
  value: number
  threshold: number
  timestamp: Date
  acknowledged: boolean
  resolvedAt?: Date
}

// Alert manager class
class AlertManager {
  private alerts: Alert[] = []
  private subscribers: Array<(alerts: Alert[]) => void> = []
  private checkInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startMonitoring()
  }

  // Start monitoring for alerts
  startMonitoring() {
    if (this.checkInterval) return

    this.checkInterval = setInterval(() => {
      this.checkForAlerts()
    }, 60000) // Check every minute
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  // Check for new alerts
  private checkForAlerts() {
    try {
      const apiStats = metricsStore.getAPIStats()
      const cacheStats = metricsStore.getCacheStats()
      const systemHealth = metricsStore.getSystemHealth()
      
      const newAlerts = checkAlertThresholds({ ...apiStats, ...cacheStats })
      
      // Check memory usage
      if (typeof process !== 'undefined') {
        const memoryUsage = process.memoryUsage()
        const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        
        if (memoryUsagePercent > ALERT_THRESHOLDS.MEMORY_CRITICAL * 100) {
          newAlerts.push({
            type: 'critical',
            message: 'Memory usage is critically high',
            metric: 'memory_usage',
            value: memoryUsagePercent,
            threshold: ALERT_THRESHOLDS.MEMORY_CRITICAL * 100
          })
        } else if (memoryUsagePercent > ALERT_THRESHOLDS.MEMORY_WARNING * 100) {
          newAlerts.push({
            type: 'warning',
            message: 'Memory usage is high',
            metric: 'memory_usage',
            value: memoryUsagePercent,
            threshold: ALERT_THRESHOLDS.MEMORY_WARNING * 100
          })
        }
      }

      // Check cache hit rate
      if (cacheStats.total > 0) {
        if (cacheStats.hitRate < ALERT_THRESHOLDS.CACHE_HIT_RATE_CRITICAL) {
          newAlerts.push({
            type: 'critical',
            message: 'Cache hit rate is critically low',
            metric: 'cache_hit_rate',
            value: cacheStats.hitRate,
            threshold: ALERT_THRESHOLDS.CACHE_HIT_RATE_CRITICAL
          })
        } else if (cacheStats.hitRate < ALERT_THRESHOLDS.CACHE_HIT_RATE_WARNING) {
          newAlerts.push({
            type: 'warning',
            message: 'Cache hit rate is low',
            metric: 'cache_hit_rate',
            value: cacheStats.hitRate,
            threshold: ALERT_THRESHOLDS.CACHE_HIT_RATE_WARNING
          })
        }
      }

      // Add new alerts
      newAlerts.forEach(alertData => {
        this.addAlert({
          title: this.getAlertTitle(alertData.type, alertData.metric),
          ...alertData
        })
      })

      // Auto-resolve alerts that are no longer triggered
      this.autoResolveAlerts(apiStats, cacheStats)

    } catch (error) {
      console.error('Error checking for alerts:', error)
    }
  }

  // Add a new alert
  private addAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>) {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(
      alert => 
        alert.metric === alertData.metric && 
        alert.type === alertData.type && 
        !alert.resolvedAt
    )

    if (existingAlert) {
      // Update existing alert
      existingAlert.value = alertData.value
      existingAlert.timestamp = new Date()
    } else {
      // Create new alert
      const newAlert: Alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        acknowledged: false,
        ...alertData
      }
      
      this.alerts.push(newAlert)
      this.notifySubscribers()
      
      // Log critical alerts
      if (newAlert.type === 'critical') {
        console.error(`CRITICAL ALERT: ${newAlert.message}`, {
          metric: newAlert.metric,
          value: newAlert.value,
          threshold: newAlert.threshold
        })
      }
    }
  }

  // Auto-resolve alerts that are no longer triggered
  private autoResolveAlerts(apiStats: any, cacheStats: any) {
    const now = new Date()
    
    this.alerts.forEach(alert => {
      if (alert.resolvedAt) return

      let shouldResolve = false

      switch (alert.metric) {
        case 'response_time':
          shouldResolve = apiStats.avgResponseTime <= alert.threshold
          break
        case 'error_rate':
          shouldResolve = apiStats.errorRate <= alert.threshold
          break
        case 'cache_hit_rate':
          shouldResolve = cacheStats.hitRate >= alert.threshold
          break
        case 'memory_usage':
          if (typeof process !== 'undefined') {
            const memoryUsage = process.memoryUsage()
            const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
            shouldResolve = memoryUsagePercent <= alert.threshold
          }
          break
      }

      if (shouldResolve) {
        alert.resolvedAt = now
        this.notifySubscribers()
      }
    })
  }

  // Get alert title based on type and metric
  private getAlertTitle(type: string, metric: string): string {
    const titles: Record<string, Record<string, string>> = {
      warning: {
        response_time: 'Tempo de Resposta Alto',
        error_rate: 'Taxa de Erro Elevada',
        memory_usage: 'Uso de Memória Alto',
        cache_hit_rate: 'Taxa de Cache Baixa'
      },
      critical: {
        response_time: 'Tempo de Resposta Crítico',
        error_rate: 'Taxa de Erro Crítica',
        memory_usage: 'Uso de Memória Crítico',
        cache_hit_rate: 'Taxa de Cache Crítica'
      }
    }

    return titles[type]?.[metric] || `${type.toUpperCase()}: ${metric}`
  }

  // Get all alerts
  getAlerts(): Alert[] {
    return [...this.alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Get active alerts (not resolved)
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolvedAt)
  }

  // Get critical alerts
  getCriticalAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.type === 'critical' && !alert.resolvedAt)
  }

  // Acknowledge an alert
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      this.notifySubscribers()
      return true
    }
    return false
  }

  // Resolve an alert manually
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolvedAt = new Date()
      this.notifySubscribers()
      return true
    }
    return false
  }

  // Subscribe to alert changes
  subscribe(callback: (alerts: Alert[]) => void): () => void {
    this.subscribers.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.getAlerts())
      } catch (error) {
        console.error('Error notifying alert subscriber:', error)
      }
    })
  }

  // Clear old resolved alerts (keep last 100)
  cleanup() {
    const resolvedAlerts = this.alerts.filter(alert => alert.resolvedAt)
    if (resolvedAlerts.length > 100) {
      const toRemove = resolvedAlerts
        .sort((a, b) => (a.resolvedAt?.getTime() || 0) - (b.resolvedAt?.getTime() || 0))
        .slice(0, resolvedAlerts.length - 100)
      
      toRemove.forEach(alert => {
        const index = this.alerts.indexOf(alert)
        if (index > -1) {
          this.alerts.splice(index, 1)
        }
      })
    }
  }

  // Get alert statistics
  getStats() {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const recent = this.alerts.filter(alert => alert.timestamp > last24h)
    const active = this.getActiveAlerts()
    const critical = this.getCriticalAlerts()
    
    return {
      total: this.alerts.length,
      recent: recent.length,
      active: active.length,
      critical: critical.length,
      acknowledged: this.alerts.filter(alert => alert.acknowledged).length,
      resolved: this.alerts.filter(alert => alert.resolvedAt).length
    }
  }
}

// Global alert manager instance
export const alertManager = new AlertManager()

// Cleanup old alerts every hour
if (typeof window === 'undefined') {
  setInterval(() => {
    alertManager.cleanup()
  }, 60 * 60 * 1000)
}

// Export types and utilities
export { ALERT_THRESHOLDS }
