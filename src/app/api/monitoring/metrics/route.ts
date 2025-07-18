import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { metricsStore } from "@/lib/monitoring"
import { checkAlertThresholds, getSystemMetrics } from "@/lib/api-monitoring"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin users to access metrics
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = parseInt(searchParams.get('timeRange') || '3600000') // Default 1 hour
    const type = searchParams.get('type') || 'all'

    let metrics: any = {}

    switch (type) {
      case 'api':
        metrics = {
          api: metricsStore.getAPIStats(timeRange),
          recent: metricsStore.getAPIMetrics(50)
        }
        break
        
      case 'cache':
        metrics = {
          cache: metricsStore.getCacheStats(timeRange),
          recent: metricsStore.getCacheMetrics(50)
        }
        break
        
      case 'performance':
        metrics = {
          performance: metricsStore.getPerformanceMetrics(100)
        }
        break
        
      case 'errors':
        metrics = {
          errors: metricsStore.getErrorMetrics(100)
        }
        break
        
      case 'health':
        metrics = {
          health: metricsStore.getSystemHealth(),
          system: getSystemMetrics()
        }
        break
        
      case 'alerts':
        const apiStats = metricsStore.getAPIStats(timeRange)
        const cacheStats = metricsStore.getCacheStats(timeRange)
        const alerts = checkAlertThresholds({ ...apiStats, ...cacheStats })
        metrics = { alerts }
        break
        
      default: // 'all'
        const allAPIStats = metricsStore.getAPIStats(timeRange)
        const allCacheStats = metricsStore.getCacheStats(timeRange)
        
        metrics = {
          api: allAPIStats,
          cache: allCacheStats,
          health: metricsStore.getSystemHealth(),
          system: getSystemMetrics(),
          alerts: checkAlertThresholds({ ...allAPIStats, ...allCacheStats }),
          recent: {
            api: metricsStore.getAPIMetrics(20),
            cache: metricsStore.getCacheMetrics(20),
            errors: metricsStore.getErrorMetrics(20),
            performance: metricsStore.getPerformanceMetrics(20)
          }
        }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timeRange,
      ...metrics
    })

  } catch (error) {
    console.error('Monitoring metrics error:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST endpoint to manually add metrics (for testing)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const data = await request.json()
    const { type, metric } = data

    switch (type) {
      case 'performance':
        metricsStore.addPerformanceMetric(metric)
        break
      case 'error':
        metricsStore.addErrorMetric(metric)
        break
      default:
        return NextResponse.json({ error: "Tipo de métrica inválido" }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Add metric error:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE endpoint to clear metrics (for testing)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    metricsStore.clear()
    
    return NextResponse.json({ success: true, message: "Métricas limpas" })

  } catch (error) {
    console.error('Clear metrics error:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
