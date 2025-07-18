'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectOption } from '@/components/ui/select'
import {
  Activity,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  BarChart3,
  Clock,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react'
import { formatDate, formatDistanceToNow } from '@/lib/utils'

interface SystemActivity {
  id: string
  action: string
  entityType: string
  entityId: string
  entityName: string
  userId: string
  userName: string
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

interface ActivityStats {
  totalActivities: number
  uniqueUsers: number
  topActions: Array<{ action: string; count: number }>
  topEntityTypes: Array<{ entityType: string; count: number }>
  activitiesLast24h: number
  activitiesLast7d: number
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<SystemActivity[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityTypeFilter, setEntityTypeFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchActivities()
    fetchStats()
  }, [page, searchTerm, actionFilter, entityTypeFilter, userFilter, dateFilter])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search: searchTerm,
        action: actionFilter,
        entityType: entityTypeFilter,
        user: userFilter,
        date: dateFilter
      })

      const response = await fetch(`/api/system-activities?${params}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
        setTotalPages(data.pagination?.pages || 1)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/system-activities/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus className="w-4 h-4 text-green-500" />
      case 'UPDATE': return <Edit className="w-4 h-4 text-blue-500" />
      case 'DELETE': return <Trash2 className="w-4 h-4 text-red-500" />
      case 'VIEW': return <Eye className="w-4 h-4 text-gray-500" />
      case 'SEARCH': return <Search className="w-4 h-4 text-purple-500" />
      case 'EXPORT': return <Download className="w-4 h-4 text-orange-500" />
      case 'LOGIN': return <User className="w-4 h-4 text-green-600" />
      case 'LOGOUT': return <User className="w-4 h-4 text-red-600" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'UPDATE': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'DELETE': return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'VIEW': return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
      case 'SEARCH': return 'bg-purple-500/10 text-purple-600 border-purple-500/20'
      case 'EXPORT': return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      case 'LOGIN': return 'bg-green-600/10 text-green-700 border-green-600/20'
      case 'LOGOUT': return 'bg-red-600/10 text-red-700 border-red-600/20'
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20'
    }
  }

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="w-4 h-4" />
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="w-4 h-4" />
    }
    
    return <Monitor className="w-4 h-4" />
  }

  const exportActivities = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        action: actionFilter,
        entityType: entityTypeFilter,
        user: userFilter,
        date: dateFilter,
        format: 'csv'
      })

      const response = await fetch(`/api/system-activities/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `activities-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting activities:', error)
    }
  }

  return (
    <DashboardLayout title="Registo de Atividades">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Registo de Atividades
            </h1>
            <p className="text-slate-400">
              Monitorização completa de todas as ações dos utilizadores
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={fetchActivities} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <Button onClick={exportActivities} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total de Atividades</p>
                    <p className="text-2xl font-bold text-slate-100">{stats.totalActivities.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Utilizadores Únicos</p>
                    <p className="text-2xl font-bold text-slate-100">{stats.uniqueUsers}</p>
                  </div>
                  <User className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Últimas 24h</p>
                    <p className="text-2xl font-bold text-slate-100">{stats.activitiesLast24h}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Últimos 7 dias</p>
                    <p className="text-2xl font-bold text-slate-100">{stats.activitiesLast7d}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Pesquisar atividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>

              <Select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-slate-800 border-slate-700 text-slate-100"
              >
                <SelectOption value="all">Todas as ações</SelectOption>
                <SelectOption value="CREATE">Criar</SelectOption>
                <SelectOption value="UPDATE">Atualizar</SelectOption>
                <SelectOption value="DELETE">Eliminar</SelectOption>
                <SelectOption value="VIEW">Visualizar</SelectOption>
                <SelectOption value="SEARCH">Pesquisar</SelectOption>
                <SelectOption value="EXPORT">Exportar</SelectOption>
                <SelectOption value="LOGIN">Login</SelectOption>
                <SelectOption value="LOGOUT">Logout</SelectOption>
              </Select>

              <Select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="bg-slate-800 border-slate-700 text-slate-100"
              >
                <SelectOption value="all">Todos os tipos</SelectOption>
                <SelectOption value="LEADS">Leads</SelectOption>
                <SelectOption value="CLIENTS">Clientes</SelectOption>
                <SelectOption value="PROJECTS">Projetos</SelectOption>
                <SelectOption value="PROPOSALS">Propostas</SelectOption>
                <SelectOption value="INVOICES">Faturas</SelectOption>
                <SelectOption value="USERS">Utilizadores</SelectOption>
                <SelectOption value="AUTH">Autenticação</SelectOption>
              </Select>

              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-slate-800 border-slate-700 text-slate-100"
              >
                <SelectOption value="all">Todo o período</SelectOption>
                <SelectOption value="today">Hoje</SelectOption>
                <SelectOption value="yesterday">Ontem</SelectOption>
                <SelectOption value="last7days">Últimos 7 dias</SelectOption>
                <SelectOption value="last30days">Últimos 30 dias</SelectOption>
                <SelectOption value="thismonth">Este mês</SelectOption>
                <SelectOption value="lastmonth">Mês passado</SelectOption>
              </Select>

              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setActionFilter('all')
                  setEntityTypeFilter('all')
                  setUserFilter('all')
                  setDateFilter('all')
                  setPage(1)
                }}
                variant="outline"
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-slate-100">
              Atividades Recentes ({activities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-slate-400">A carregar atividades...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  Nenhuma atividade encontrada
                </h3>
                <p className="text-slate-400">
                  Tente ajustar os filtros de pesquisa
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getActionIcon(activity.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`border ${getActionColor(activity.action)}`}>
                              {activity.action}
                            </Badge>
                            <span className="text-sm text-slate-400">
                              {activity.entityType}
                            </span>
                          </div>
                          <p className="text-sm text-slate-100 mb-1">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {activity.userName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {activity.ipAddress || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              {getDeviceIcon(activity.userAgent)}
                              {activity.userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(activity.createdAt))}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-slate-400">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
