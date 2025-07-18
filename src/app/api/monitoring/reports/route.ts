import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { metricsStore } from "@/lib/monitoring"
import { alertManager } from "@/lib/alerts"
import { ReportConfig, ReportData } from "@/lib/reports"
import { subDays, startOfDay, endOfDay } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin users to generate reports
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      dateRange, 
      sections = {
        overview: true,
        api: true,
        cache: true,
        performance: true,
        alerts: true,
        errors: true
      },
      format = 'pdf',
      title = 'Relatório de Monitorização do Sistema'
    } = body

    // Parse date range
    const startDate = dateRange?.start ? new Date(dateRange.start) : subDays(new Date(), 7)
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date()

    // Calculate time range in milliseconds
    const timeRange = endDate.getTime() - startDate.getTime()

    // Collect data for the report
    const reportData = await collectReportData(timeRange)

    // Create report config
    const config: ReportConfig = {
      title,
      dateRange: {
        start: startOfDay(startDate),
        end: endOfDay(endDate)
      },
      includeCharts: true,
      includeDetails: true,
      format,
      sections
    }

    return NextResponse.json({
      success: true,
      config,
      data: reportData,
      message: "Dados do relatório coletados com sucesso"
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve available report templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const templates = [
      {
        id: 'daily',
        name: 'Relatório Diário',
        description: 'Relatório das últimas 24 horas',
        dateRange: {
          start: subDays(new Date(), 1),
          end: new Date()
        },
        sections: {
          overview: true,
          api: true,
          cache: true,
          performance: false,
          alerts: true,
          errors: true
        }
      },
      {
        id: 'weekly',
        name: 'Relatório Semanal',
        description: 'Relatório dos últimos 7 dias',
        dateRange: {
          start: subDays(new Date(), 7),
          end: new Date()
        },
        sections: {
          overview: true,
          api: true,
          cache: true,
          performance: true,
          alerts: true,
          errors: true
        }
      },
      {
        id: 'monthly',
        name: 'Relatório Mensal',
        description: 'Relatório dos últimos 30 dias',
        dateRange: {
          start: subDays(new Date(), 30),
          end: new Date()
        },
        sections: {
          overview: true,
          api: true,
          cache: true,
          performance: true,
          alerts: true,
          errors: false
        }
      },
      {
        id: 'performance',
        name: 'Relatório de Performance',
        description: 'Foco em métricas de performance',
        dateRange: {
          start: subDays(new Date(), 7),
          end: new Date()
        },
        sections: {
          overview: true,
          api: true,
          cache: true,
          performance: true,
          alerts: false,
          errors: false
        }
      },
      {
        id: 'security',
        name: 'Relatório de Segurança',
        description: 'Foco em alertas e erros',
        dateRange: {
          start: subDays(new Date(), 7),
          end: new Date()
        },
        sections: {
          overview: true,
          api: false,
          cache: false,
          performance: false,
          alerts: true,
          errors: true
        }
      }
    ]

    return NextResponse.json({
      templates,
      currentStats: {
        totalMetrics: metricsStore.getAPIMetrics(1).length + 
                     metricsStore.getCacheMetrics(1).length + 
                     metricsStore.getPerformanceMetrics(1).length,
        activeAlerts: alertManager.getActiveAlerts().length,
        systemHealth: metricsStore.getSystemHealth()
      }
    })

  } catch (error) {
    console.error('Report templates error:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// Helper function to collect all report data
async function collectReportData(timeRange: number): Promise<ReportData> {
  try {
    // Get metrics from the monitoring system
    const apiStats = metricsStore.getAPIStats(timeRange)
    const cacheStats = metricsStore.getCacheStats(timeRange)
    const systemHealth = metricsStore.getSystemHealth()
    const alerts = alertManager.getAlerts()
    const activeAlerts = alertManager.getActiveAlerts()
    const criticalAlerts = alertManager.getCriticalAlerts()

    // Get recent data
    const recentAPI = metricsStore.getAPIMetrics(100)
    const recentCache = metricsStore.getCacheMetrics(100)
    const recentPerformance = metricsStore.getPerformanceMetrics(100)
    const recentErrors = metricsStore.getErrorMetrics(100)

    // Calculate overview metrics
    const overview = {
      totalRequests: apiStats.totalRequests || 0,
      avgResponseTime: apiStats.avgResponseTime || 0,
      errorRate: apiStats.errorRate || 0,
      cacheHitRate: cacheStats.hitRate || 0,
      uptime: systemHealth.uptime || 0,
      criticalAlerts: criticalAlerts.length
    }

    // Prepare API data
    const apiData = {
      stats: apiStats,
      endpoints: apiStats.endpointStats || [],
      recent: recentAPI.slice(0, 50)
    }

    // Prepare cache data
    const cacheData = {
      stats: cacheStats,
      operations: cacheStats.operations || {}
    }

    // Prepare performance data
    const performanceData = {
      metrics: recentPerformance,
      webVitals: {
        lcp: recentPerformance.filter(m => m.name === 'lcp').slice(-1)[0]?.value || 0,
        fid: recentPerformance.filter(m => m.name === 'fid').slice(-1)[0]?.value || 0,
        cls: recentPerformance.filter(m => m.name === 'cls').slice(-1)[0]?.value || 0
      }
    }

    // Prepare alerts data
    const alertsData = {
      total: alerts.length,
      critical: criticalAlerts.length,
      recent: alerts.slice(0, 50)
    }

    // Prepare errors data
    const errorsData = {
      total: recentErrors.length,
      recent: recentErrors.slice(0, 50),
      byType: recentErrors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Metadata
    const metadata = {
      generatedAt: new Date(),
      period: `${Math.round(timeRange / (1000 * 60 * 60 * 24))} dias`,
      totalDataPoints: recentAPI.length + recentCache.length + recentPerformance.length + recentErrors.length
    }

    return {
      overview,
      api: apiData,
      cache: cacheData,
      performance: performanceData,
      alerts: alertsData,
      errors: errorsData,
      metadata
    }

  } catch (error) {
    console.error('Error collecting report data:', error)
    throw error
  }
}
