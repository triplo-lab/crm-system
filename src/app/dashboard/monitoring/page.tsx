"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  MemoryStick,
  RefreshCw,
  Server,
  TrendingUp,
  Zap,
  XCircle,
  FileText,
  Download
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface MonitoringData {
  api: {
    totalRequests: number
    avgResponseTime: number
    errorRate: number
    endpointStats: Array<{
      endpoint: string
      count: number
      avgResponseTime: number
      errorRate: number
    }>
  }
  cache: {
    hits: number
    misses: number
    total: number
    hitRate: number
    operations: Record<string, number>
  }
  health: {
    status: 'healthy' | 'warning' | 'critical'
    avgResponseTime: number
    errorCount: number
    criticalErrors: number
    uptime: number
    memoryUsage: {
      rss: number
      heapTotal: number
      heapUsed: number
      external: number
    }
  }
  alerts: Array<{
    type: 'warning' | 'critical'
    message: string
    metric: string
    value: number
    threshold: number
  }>
  recent: {
    api: Array<{
      endpoint: string
      method: string
      statusCode: number
      responseTime: number
      timestamp: string
    }>
    errors: Array<{
      error: string
      severity: string
      endpoint?: string
      timestamp: string
    }>
  }
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchMonitoringData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/monitoring/metrics?type=all')
      if (response.ok) {
        const result = await response.json()
        setData(result)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonitoringData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400'
      case 'warning':
        return 'text-yellow-400'
      case 'critical':
        return 'text-red-400'
      default:
        return 'text-slate-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Activity className="w-5 h-5 text-slate-400" />
    }
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Monitorização do Sistema</h1>
            <p className="text-slate-400 mt-1">
              Última atualização: {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/dashboard/monitoring/reports', '_blank')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Relatórios
            </Button>
            <Button
              variant={autoRefresh ? "primary" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className="w-4 h-4 mr-2" />
              Auto-refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMonitoringData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* System Health Overview */}
        {data?.health && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(data.health.status)}
                Estado do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getStatusColor(data.health.status)}`}>
                    {data.health.status.toUpperCase()}
                  </div>
                  <div className="text-sm text-slate-400">Estado Geral</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {data.health.avgResponseTime}ms
                  </div>
                  <div className="text-sm text-slate-400">Tempo Médio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {formatUptime(data.health.uptime)}
                  </div>
                  <div className="text-sm text-slate-400">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {formatBytes(data.health.memoryUsage.heapUsed)}
                  </div>
                  <div className="text-sm text-slate-400">Memória Usada</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Alertas Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      alert.type === 'critical' 
                        ? 'border-red-500/20 bg-red-500/10' 
                        : 'border-yellow-500/20 bg-yellow-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{alert.message}</span>
                      <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {alert.metric}: {alert.value} (limite: {alert.threshold})
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Performance */}
        {data?.api && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Performance das APIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{data.api.totalRequests}</div>
                    <div className="text-sm text-slate-400">Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{data.api.avgResponseTime}ms</div>
                    <div className="text-sm text-slate-400">Tempo Médio</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${data.api.errorRate > 5 ? 'text-red-400' : 'text-green-400'}`}>
                      {data.api.errorRate}%
                    </div>
                    <div className="text-sm text-slate-400">Taxa de Erro</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-white">Endpoints Mais Usados</h4>
                  {data.api.endpointStats.slice(0, 5).map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                      <span className="text-sm font-mono">{endpoint.endpoint}</span>
                      <div className="flex items-center gap-2 text-sm">
                        <span>{endpoint.count}</span>
                        <span className="text-slate-400">|</span>
                        <span>{endpoint.avgResponseTime}ms</span>
                        <span className="text-slate-400">|</span>
                        <span className={endpoint.errorRate > 0 ? 'text-red-400' : 'text-green-400'}>
                          {endpoint.errorRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cache Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Performance do Cache
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{data.cache?.total || 0}</div>
                    <div className="text-sm text-slate-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${(data.cache?.hitRate || 0) > 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {data.cache?.hitRate || 0}%
                    </div>
                    <div className="text-sm text-slate-400">Hit Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{data.cache?.hits || 0}</div>
                    <div className="text-sm text-slate-400">Hits</div>
                  </div>
                </div>
                
                {data.cache?.operations && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-white">Operações de Cache</h4>
                    {Object.entries(data.cache.operations).map(([operation, count]) => (
                      <div key={operation} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                        <span className="text-sm capitalize">{operation}</span>
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
