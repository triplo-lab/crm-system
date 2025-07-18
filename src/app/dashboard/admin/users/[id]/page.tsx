"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Calendar, 
  Activity,
  FolderOpen,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Loader2,
  Shield,
  User
} from "lucide-react"
import { formatDate, formatDateTime } from "@/lib/utils"
import Link from "next/link"

interface UserDetails {
  id: string
  name: string
  email: string
  role: string
  status: string
  avatar?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
  stats: {
    projectsCount: number
    tasksCount: number
    timeEntriesCount: number
    ticketsCount: number
    clientsCount: number
    invoicesCount: number
    totalHours: number
    totalTimeEntries: number
  }
  recentActivity: {
    projects: Array<{
      id: string
      name: string
      status: string
      client: { name: string }
    }>
    tasks: Array<{
      id: string
      title: string
      status: string
      priority: string
      dueDate?: string
      project: { name: string }
    }>
    timeEntries: Array<{
      id: string
      description: string
      startTime: string
      endTime?: string
      duration: number
      project: { name: string }
    }>
  }
}

export default function UserDetailsPage() {
  const params = useParams()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchUser()
    }
  }, [params.id])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${params.id}`)
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        console.error('Failed to fetch user:', await response.text())
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'MANAGER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'EMPLOYEE':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador'
      case 'MANAGER':
        return 'Gestor'
      case 'EMPLOYEE':
        return 'Funcionário'
      default:
        return role
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'INACTIVE':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo'
      case 'INACTIVE':
        return 'Inativo'
      case 'PENDING':
        return 'Pendente'
      default:
        return status
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <DashboardLayout title="Detalhes do Utilizador">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout title="Utilizador Não Encontrado">
        <div className="text-center py-12">
          <User className="w-24 h-24 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            Utilizador não encontrado
          </h3>
          <p className="text-slate-400 mb-6">
            O utilizador que procura não existe ou foi removido
          </p>
          <Link href="/dashboard/admin">
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar à Administração
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={user.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">{user.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                    {getRoleText(user.role)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                    {getStatusText(user.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Link href={`/dashboard/admin/users/${user.id}/edit`}>
            <Button className="gap-2">
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </Link>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">
                  Criado em {formatDate(user.createdAt)}
                </span>
              </div>
              {user.lastLogin && (
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400">
                    Último acesso: {formatDateTime(user.lastLogin)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card variant="elevated" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Estatísticas de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-800 rounded-lg">
                  <FolderOpen className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-100">{user.stats.projectsCount}</div>
                  <div className="text-sm text-slate-400">Projetos</div>
                </div>
                <div className="text-center p-4 bg-slate-800 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-100">{user.stats.tasksCount}</div>
                  <div className="text-sm text-slate-400">Tarefas</div>
                </div>
                <div className="text-center p-4 bg-slate-800 rounded-lg">
                  <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-100">{user.stats.totalHours}h</div>
                  <div className="text-sm text-slate-400">Horas</div>
                </div>
                <div className="text-center p-4 bg-slate-800 rounded-lg">
                  <FileText className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-100">{user.stats.ticketsCount}</div>
                  <div className="text-sm text-slate-400">Tickets</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Projetos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.recentActivity.projects.length > 0 ? (
                  user.recentActivity.projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-100">{project.name}</p>
                        <p className="text-sm text-slate-400">{project.client.name}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded">
                        {project.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">Nenhum projeto encontrado</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Time Entries */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Tempo Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.recentActivity.timeEntries.length > 0 ? (
                  user.recentActivity.timeEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-100">{entry.description}</p>
                        <p className="text-sm text-slate-400">{entry.project.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-100">
                          {formatDuration(entry.duration)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(entry.startTime)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">Nenhuma entrada de tempo encontrada</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
