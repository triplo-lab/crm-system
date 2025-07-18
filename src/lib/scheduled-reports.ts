import { ReportConfig, ReportData, generateReport } from './reports'
import { metricsStore } from './monitoring'
import { alertManager } from './alerts'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Scheduled report types
export interface ScheduledReport {
  id: string
  name: string
  description: string
  config: ReportConfig
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string // HH:mm format
    dayOfWeek?: number // 0-6 for weekly reports
    dayOfMonth?: number // 1-31 for monthly reports
  }
  recipients: string[] // Email addresses
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  createdAt: Date
  createdBy: string
}

export interface ScheduledReportRun {
  id: string
  reportId: string
  startTime: Date
  endTime?: Date
  status: 'running' | 'completed' | 'failed'
  error?: string
  filePath?: string
  fileSize?: number
}

// Scheduled reports manager
class ScheduledReportsManager {
  private reports: ScheduledReport[] = []
  private runs: ScheduledReportRun[] = []
  private intervals: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.loadReports()
    this.scheduleAllReports()
  }

  // Add a new scheduled report
  addScheduledReport(report: Omit<ScheduledReport, 'id' | 'createdAt' | 'nextRun'>): ScheduledReport {
    const newReport: ScheduledReport = {
      ...report,
      id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      nextRun: this.calculateNextRun(report.schedule)
    }

    this.reports.push(newReport)
    this.saveReports()

    if (newReport.enabled) {
      this.scheduleReport(newReport)
    }

    return newReport
  }

  // Update a scheduled report
  updateScheduledReport(id: string, updates: Partial<ScheduledReport>): boolean {
    const index = this.reports.findIndex(r => r.id === id)
    if (index === -1) return false

    const oldReport = this.reports[index]
    const updatedReport = { ...oldReport, ...updates }

    // Recalculate next run if schedule changed
    if (updates.schedule) {
      updatedReport.nextRun = this.calculateNextRun(updates.schedule)
    }

    this.reports[index] = updatedReport
    this.saveReports()

    // Reschedule if needed
    this.unscheduleReport(id)
    if (updatedReport.enabled) {
      this.scheduleReport(updatedReport)
    }

    return true
  }

  // Delete a scheduled report
  deleteScheduledReport(id: string): boolean {
    const index = this.reports.findIndex(r => r.id === id)
    if (index === -1) return false

    this.unscheduleReport(id)
    this.reports.splice(index, 1)
    this.saveReports()

    return true
  }

  // Get all scheduled reports
  getScheduledReports(): ScheduledReport[] {
    return [...this.reports]
  }

  // Get scheduled report by ID
  getScheduledReport(id: string): ScheduledReport | undefined {
    return this.reports.find(r => r.id === id)
  }

  // Get report runs
  getReportRuns(reportId?: string): ScheduledReportRun[] {
    if (reportId) {
      return this.runs.filter(r => r.reportId === reportId)
    }
    return [...this.runs]
  }

  // Run a scheduled report manually
  async runReportNow(id: string): Promise<boolean> {
    const report = this.getScheduledReport(id)
    if (!report) return false

    return await this.executeReport(report)
  }

  // Calculate next run time
  private calculateNextRun(schedule: ScheduledReport['schedule']): Date {
    const now = new Date()
    const [hours, minutes] = schedule.time.split(':').map(Number)
    
    const nextRun = new Date()
    nextRun.setHours(hours, minutes, 0, 0)

    switch (schedule.frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1)
        }
        break

      case 'weekly':
        const targetDay = schedule.dayOfWeek || 0
        const currentDay = nextRun.getDay()
        let daysUntilTarget = targetDay - currentDay
        
        if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && nextRun <= now)) {
          daysUntilTarget += 7
        }
        
        nextRun.setDate(nextRun.getDate() + daysUntilTarget)
        break

      case 'monthly':
        const targetDate = schedule.dayOfMonth || 1
        nextRun.setDate(targetDate)
        
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1)
          nextRun.setDate(targetDate)
        }
        break
    }

    return nextRun
  }

  // Schedule a report
  private scheduleReport(report: ScheduledReport): void {
    if (!report.nextRun) return

    const delay = report.nextRun.getTime() - Date.now()
    
    if (delay > 0) {
      const timeout = setTimeout(async () => {
        await this.executeReport(report)
        
        // Schedule next run
        const updatedReport = { ...report, nextRun: this.calculateNextRun(report.schedule) }
        this.updateScheduledReport(report.id, { nextRun: updatedReport.nextRun })
        
        if (updatedReport.enabled) {
          this.scheduleReport(updatedReport)
        }
      }, delay)

      this.intervals.set(report.id, timeout)
    }
  }

  // Unschedule a report
  private unscheduleReport(id: string): void {
    const timeout = this.intervals.get(id)
    if (timeout) {
      clearTimeout(timeout)
      this.intervals.delete(id)
    }
  }

  // Schedule all enabled reports
  private scheduleAllReports(): void {
    this.reports.filter(r => r.enabled).forEach(report => {
      this.scheduleReport(report)
    })
  }

  // Execute a report
  private async executeReport(report: ScheduledReport): Promise<boolean> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const run: ScheduledReportRun = {
      id: runId,
      reportId: report.id,
      startTime: new Date(),
      status: 'running'
    }

    this.runs.push(run)

    try {
      // Collect report data
      const timeRange = this.getTimeRangeForFrequency(report.schedule.frequency)
      const reportData = await this.collectReportData(timeRange)

      // Update report config with current date range
      const config = {
        ...report.config,
        dateRange: {
          start: startOfDay(subDays(new Date(), this.getDaysForFrequency(report.schedule.frequency))),
          end: endOfDay(new Date())
        }
      }

      // Generate report (this would normally save to file system)
      await generateReport(config, reportData)

      // Update run status
      run.status = 'completed'
      run.endTime = new Date()
      run.fileSize = this.estimateFileSize(config, reportData)

      // Update last run time
      this.updateScheduledReport(report.id, { lastRun: new Date() })

      console.log(`Scheduled report "${report.name}" completed successfully`)
      return true

    } catch (error) {
      run.status = 'failed'
      run.endTime = new Date()
      run.error = error instanceof Error ? error.message : 'Unknown error'

      console.error(`Scheduled report "${report.name}" failed:`, error)
      return false
    }
  }

  // Collect report data
  private async collectReportData(timeRange: number): Promise<ReportData> {
    const apiStats = metricsStore.getAPIStats(timeRange)
    const cacheStats = metricsStore.getCacheStats(timeRange)
    const systemHealth = metricsStore.getSystemHealth()
    const alerts = alertManager.getAlerts()
    const activeAlerts = alertManager.getActiveAlerts()
    const criticalAlerts = alertManager.getCriticalAlerts()

    const recentAPI = metricsStore.getAPIMetrics(100)
    const recentCache = metricsStore.getCacheMetrics(100)
    const recentPerformance = metricsStore.getPerformanceMetrics(100)
    const recentErrors = metricsStore.getErrorMetrics(100)

    return {
      overview: {
        totalRequests: apiStats.totalRequests || 0,
        avgResponseTime: apiStats.avgResponseTime || 0,
        errorRate: apiStats.errorRate || 0,
        cacheHitRate: cacheStats.hitRate || 0,
        uptime: systemHealth.uptime || 0,
        criticalAlerts: criticalAlerts.length
      },
      api: {
        stats: apiStats,
        endpoints: apiStats.endpointStats || [],
        recent: recentAPI.slice(0, 50)
      },
      cache: {
        stats: cacheStats,
        operations: cacheStats.operations || {}
      },
      performance: {
        metrics: recentPerformance,
        webVitals: {
          lcp: recentPerformance.filter(m => m.name === 'lcp').slice(-1)[0]?.value || 0,
          fid: recentPerformance.filter(m => m.name === 'fid').slice(-1)[0]?.value || 0,
          cls: recentPerformance.filter(m => m.name === 'cls').slice(-1)[0]?.value || 0
        }
      },
      alerts: {
        total: alerts.length,
        critical: criticalAlerts.length,
        recent: alerts.slice(0, 50)
      },
      errors: {
        total: recentErrors.length,
        recent: recentErrors.slice(0, 50),
        byType: recentErrors.reduce((acc, error) => {
          acc[error.severity] = (acc[error.severity] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      },
      metadata: {
        generatedAt: new Date(),
        period: `${Math.round(timeRange / (1000 * 60 * 60 * 24))} dias`,
        totalDataPoints: recentAPI.length + recentCache.length + recentPerformance.length + recentErrors.length
      }
    }
  }

  // Helper methods
  private getTimeRangeForFrequency(frequency: string): number {
    switch (frequency) {
      case 'daily': return 24 * 60 * 60 * 1000 // 1 day
      case 'weekly': return 7 * 24 * 60 * 60 * 1000 // 7 days
      case 'monthly': return 30 * 24 * 60 * 60 * 1000 // 30 days
      default: return 24 * 60 * 60 * 1000
    }
  }

  private getDaysForFrequency(frequency: string): number {
    switch (frequency) {
      case 'daily': return 1
      case 'weekly': return 7
      case 'monthly': return 30
      default: return 1
    }
  }

  private estimateFileSize(config: ReportConfig, data: ReportData): number {
    // Rough estimation based on content
    const sectionsCount = Object.values(config.sections).filter(Boolean).length
    const dataPoints = data.metadata.totalDataPoints
    
    if (config.format === 'pdf') {
      return Math.max(500000, sectionsCount * dataPoints * 100) // Minimum 500KB
    } else {
      return Math.max(200000, sectionsCount * dataPoints * 50) // Minimum 200KB
    }
  }

  // Persistence methods (in production, use database)
  private loadReports(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('scheduledReports')
        if (stored) {
          this.reports = JSON.parse(stored).map((r: any) => ({
            ...r,
            createdAt: new Date(r.createdAt),
            lastRun: r.lastRun ? new Date(r.lastRun) : undefined,
            nextRun: r.nextRun ? new Date(r.nextRun) : undefined
          }))
        }
      }
    } catch (error) {
      console.error('Error loading scheduled reports:', error)
    }
  }

  private saveReports(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('scheduledReports', JSON.stringify(this.reports))
      }
    } catch (error) {
      console.error('Error saving scheduled reports:', error)
    }
  }

  // Cleanup old runs
  cleanup(): void {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
    this.runs = this.runs.filter(run => run.startTime > cutoff)
  }
}

// Global scheduled reports manager
export const scheduledReportsManager = new ScheduledReportsManager()

// Cleanup old runs every day
if (typeof window === 'undefined') {
  setInterval(() => {
    scheduledReportsManager.cleanup()
  }, 24 * 60 * 60 * 1000)
}

// Default templates for scheduled reports
export const defaultScheduledReportTemplates = [
  {
    name: 'Relatório Diário de Performance',
    description: 'Relatório automático diário com métricas de performance',
    schedule: { frequency: 'daily' as const, time: '08:00' },
    config: {
      title: 'Relatório Diário de Performance',
      format: 'pdf' as const,
      includeCharts: true,
      includeDetails: false,
      sections: {
        overview: true,
        api: true,
        cache: true,
        performance: false,
        alerts: true,
        errors: true
      }
    }
  },
  {
    name: 'Relatório Semanal Executivo',
    description: 'Resumo semanal para gestão',
    schedule: { frequency: 'weekly' as const, time: '09:00', dayOfWeek: 1 }, // Monday
    config: {
      title: 'Relatório Semanal Executivo',
      format: 'pdf' as const,
      includeCharts: true,
      includeDetails: false,
      sections: {
        overview: true,
        api: true,
        cache: false,
        performance: true,
        alerts: true,
        errors: false
      }
    }
  }
]
