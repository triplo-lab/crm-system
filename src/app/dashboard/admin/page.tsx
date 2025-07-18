"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  Filter, 
  Users,
  Settings,
  Shield,
  Database,
  Activity,
  BarChart3,
  Loader2,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Key,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  avatar?: string
  lastLogin?: string
  projectsCount: number
  tasksCount: number
  createdAt: string
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalProjects: number
  totalClients: number
  totalInvoices: number
  systemHealth: 'GOOD' | 'WARNING' | 'CRITICAL'
  storageUsed: number
  storageTotal: number
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchData()
  }, [searchTerm, roleFilter, statusFilter])

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja desativar este utilizador?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchData() // Refresh the list
        alert('Utilizador desativado com sucesso')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao desativar utilizador')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Erro ao desativar utilizador')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Build query parameters for users
      const userParams = new URLSearchParams()
      if (searchTerm) userParams.append('search', searchTerm)
      if (roleFilter !== 'all') userParams.append('role', roleFilter)
      if (statusFilter !== 'all') userParams.append('status', statusFilter)

      const [usersRes, statsRes] = await Promise.all([
        fetch(`/api/admin/users?${userParams.toString()}`),
        fetch('/api/admin/stats')
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      } else {
        console.error('Failed to fetch users:', await usersRes.text())
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      } else {
        console.error('Failed to fetch stats:', await statsRes.text())
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
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

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'GOOD':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'CRITICAL':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Activity className="w-5 h-5 text-slate-400" />
    }
  }

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  }) : []

  if (loading) {
    return (
      <DashboardLayout title="Administração">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Administração">
      <div className="space-y-6">
        {/* System Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Utilizadores Totais</p>
                    <p className="text-2xl font-bold text-slate-100">{stats.totalUsers}</p>
                    <p className="text-xs text-green-400">{stats.activeUsers} ativos</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Projetos</p>
                    <p className="text-2xl font-bold text-slate-100">{stats.totalProjects}</p>
                    <p className="text-xs text-slate-400">Total no sistema</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Clientes</p>
                    <p className="text-2xl font-bold text-slate-100">{stats.totalClients}</p>
                    <p className="text-xs text-slate-400">Registados</p>
                  </div>
                  <Users className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Estado do Sistema</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getHealthIcon(stats.systemHealth)}
                      <span className="text-lg font-semibold text-slate-100">
                        {stats.systemHealth === 'GOOD' ? 'Saudável' : 
                         stats.systemHealth === 'WARNING' ? 'Atenção' : 'Crítico'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {Math.round((stats.storageUsed / stats.storageTotal) * 100)}% armazenamento
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades administrativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/admin/users/new">
                <Button variant="outline" className="h-auto flex-col gap-3 p-6 hover:scale-105 transition-all duration-200">
                  <UserPlus className="w-6 h-6 text-blue-400" />
                  <span className="text-sm font-semibold">Novo Utilizador</span>
                </Button>
              </Link>
              <Link href="/dashboard/admin/settings">
                <Button variant="outline" className="h-auto flex-col gap-3 p-6 hover:scale-105 transition-all duration-200">
                  <Settings className="w-6 h-6 text-green-400" />
                  <span className="text-sm font-semibold">Configurações</span>
                </Button>
              </Link>
              <Link href="/dashboard/admin/permissions">
                <Button variant="outline" className="h-auto flex-col gap-3 p-6 hover:scale-105 transition-all duration-200">
                  <Shield className="w-6 h-6 text-purple-400" />
                  <span className="text-sm font-semibold">Permissões</span>
                </Button>
              </Link>
              <Link href="/dashboard/admin/backup">
                <Button variant="outline" className="h-auto flex-col gap-3 p-6 hover:scale-105 transition-all duration-200">
                  <Database className="w-6 h-6 text-orange-400" />
                  <span className="text-sm font-semibold">Backup</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Users Management */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gestão de Utilizadores</CardTitle>
                <CardDescription>
                  Gerir utilizadores e permissões do sistema
                </CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Pesquisar utilizadores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as Funções</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="MANAGER">Gestor</option>
                  <option value="EMPLOYEE">Funcionário</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Estados</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-100">{user.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                          {getRoleText(user.role)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                          {getStatusText(user.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Criado em {formatDate(user.createdAt)}
                        </div>
                        {user.lastLogin && (
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            Último acesso: {formatDate(user.lastLogin)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/admin/users/${user.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                    </Link>
                    <Link href={`/dashboard/admin/users/${user.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
