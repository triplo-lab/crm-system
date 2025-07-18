"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  FolderOpen,
  Euro,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Activity,
  Target,
  Zap,
  Loader2
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { SystemActivities } from "@/components/system-activities"

interface DashboardStats {
  projects: {
    total: number
    active: number
    change: string
    trend: 'up' | 'down'
  }
  clients: {
    total: number
    active: number
    change: string
    trend: 'up' | 'down'
  }
  revenue: {
    total: number
    thisMonth: number
    change: string
    trend: 'up' | 'down'
  }
  timeTracking: {
    hoursThisWeek: number
    change: string
    trend: 'up' | 'down'
  }
}

interface Activity {
  id: string
  type: string
  title: string
  description: string
  time: string
  icon: string
}

interface UpcomingTask {
  id: string
  title: string
  project: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDateFormatted: string
  isOverdue: boolean
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch all dashboard data in parallel
        const [statsRes, activitiesRes, tasksRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/activities'),
          fetch('/api/dashboard/upcoming-tasks')
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json()
          setActivities(activitiesData)
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setUpcomingTasks(tasksData)
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      FolderOpen,
      Users,
      DollarSign,
      CheckCircle
    }
    return icons[iconName] || Activity
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-headline">Bem-vindo de volta!</h2>
            <p className="text-subtitle mt-2">Aqui está um resumo da sua atividade hoje.</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Projeto
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="elevated" hover className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="space-y-2">
                  <CardTitle className="stat-label">
                    Projetos Ativos
                  </CardTitle>
                  <div className="stat-value">{stats?.projects?.active || 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 group-hover:scale-110 transition-transform duration-200">
                  <FolderOpen className="h-6 w-6 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  {stats?.projects?.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${stats?.projects?.trend === "up" ? "text-green-400" : "text-red-400"}`}>
                    {stats?.projects?.change || "0%"}
                  </span>
                  <span className="text-sm text-slate-400">
                    este mês
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" hover className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="space-y-2">
                  <CardTitle className="stat-label">
                    Clientes
                  </CardTitle>
                  <div className="stat-value">{stats?.clients?.total || 0}</div>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10 group-hover:scale-110 transition-transform duration-200">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  {stats?.clients?.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${stats?.clients?.trend === "up" ? "text-green-400" : "text-red-400"}`}>
                    {stats?.clients?.change || "0%"}
                  </span>
                  <span className="text-sm text-slate-400">
                    este mês
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" hover className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="space-y-2">
                  <CardTitle className="stat-label">
                    Receita Mensal
                  </CardTitle>
                  <div className="stat-value">{formatCurrency(stats?.revenue?.thisMonth || 0)}</div>
                </div>
                <div className="p-3 rounded-xl bg-yellow-500/10 group-hover:scale-110 transition-transform duration-200">
                  <Euro className="h-6 w-6 text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  {stats?.revenue?.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${stats?.revenue?.trend === "up" ? "text-green-400" : "text-red-400"}`}>
                    {stats?.revenue?.change || "0%"}
                  </span>
                  <span className="text-sm text-slate-400">
                    vs mês anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" hover className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="space-y-2">
                  <CardTitle className="stat-label">
                    Horas Trabalhadas
                  </CardTitle>
                  <div className="stat-value">{stats?.timeTracking?.hoursThisWeek || 0}h</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 group-hover:scale-110 transition-transform duration-200">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  {stats?.timeTracking?.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${stats?.timeTracking?.trend === "up" ? "text-green-400" : "text-red-400"}`}>
                    {stats?.timeTracking?.change || "0%"}
                  </span>
                  <span className="text-sm text-slate-400">
                    esta semana
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Activities */}
          <SystemActivities
            limit={10}
            className="lg:col-span-2"
          />

          {/* Upcoming Tasks */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Próximas Tarefas
              </CardTitle>
              <CardDescription>
                Tarefas com prazo próximo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.length > 0 ? upcomingTasks.map((task) => (
                  <div key={task.id} className={`p-3 rounded-lg border transition-colors ${
                    task.isOverdue
                      ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
                      : 'border-slate-700 hover:bg-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-100">{task.title}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'high' || task.priority === 'urgent'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : task.priority === 'medium'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {task.priority === 'high' || task.priority === 'urgent' ? 'Alta' :
                         task.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-1">
                      {task.project}
                    </p>
                    <div className="flex items-center gap-1">
                      <Calendar className={`w-3 h-3 ${task.isOverdue ? 'text-red-400' : 'text-slate-500'}`} />
                      <p className={`text-xs ${task.isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                        {task.dueDateFormatted}
                      </p>
                      {task.isOverdue && (
                        <span className="text-xs text-red-400 font-medium ml-2">ATRASADA</span>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhuma tarefa próxima</p>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                Ver todas as tarefas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto flex-col gap-3 p-6 hover:scale-105 transition-all duration-200"
              >
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <FolderOpen className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-sm font-semibold">Novo Projeto</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-3 p-6 hover:scale-105 transition-all duration-200"
              >
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <span className="text-sm font-semibold">Novo Cliente</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-3 p-6 hover:scale-105 transition-all duration-200"
              >
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <Euro className="h-6 w-6 text-yellow-400" />
                </div>
                <span className="text-sm font-semibold">Nova Fatura</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-3 p-6 hover:scale-105 transition-all duration-200"
              >
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
                <span className="text-sm font-semibold">Iniciar Timer</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
