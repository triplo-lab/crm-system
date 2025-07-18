'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Search, 
  Shield, 
  Users, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface Permission {
  id: string
  name: string
  description: string
  module: string
  action: string
}

interface Role {
  id: string
  name: string
  description: string
  baseRole: string
  isActive: boolean
  _count: {
    userRoles: number
    rolePermissions: number
  }
  rolePermissions: {
    permission: Permission
    granted: boolean
  }[]
}

interface User {
  id: string
  name: string
  email: string
  role: string
  userRoles?: {
    role: Role
  }[]
}

export default function PermissionsPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rolesRes, usersRes, permissionsRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/admin/users?include=roles'),
        fetch('/api/admin/permissions')
      ])

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        setRoles(rolesData.roles || [])
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json()
        setPermissions(permissionsData.permissions || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const assignRoleToUser = async (userId: string, roleId: string) => {
    try {
      const response = await fetch('/api/admin/user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId })
      })

      if (response.ok) {
        toast.success('Função atribuída com sucesso!')
        fetchData()
      } else {
        toast.error('Erro ao atribuir função')
      }
    } catch (error) {
      console.error('Error assigning role:', error)
      toast.error('Erro ao atribuir função')
    }
  }

  const removeRoleFromUser = async (userId: string, roleId: string) => {
    try {
      const response = await fetch('/api/admin/user-roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId })
      })

      if (response.ok) {
        toast.success('Função removida com sucesso!')
        fetchData()
      } else {
        toast.error('Erro ao remover função')
      }
    } catch (error) {
      console.error('Error removing role:', error)
      toast.error('Erro ao remover função')
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      leads: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      clients: 'bg-green-500/10 text-green-400 border-green-500/20',
      projects: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      proposals: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      tasks: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      invoices: 'bg-red-500/10 text-red-400 border-red-500/20',
      tickets: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      users: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      reports: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      system: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
    return colors[module] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  }

  const getRoleColor = (baseRole: string) => {
    switch (baseRole) {
      case 'ADMIN': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'MANAGER': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'EMPLOYEE': return 'bg-green-500/10 text-green-400 border-green-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-200">Gestão de Permissões</h1>
            <p className="text-slate-300">A carregar...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-200">Gestão de Permissões</h1>
            <p className="text-slate-300">Gerir funções e permissões dos utilizadores</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Pesquisar utilizadores ou funções..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-slate-200 bg-slate-800 border-slate-600"
        />
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Utilizadores
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Funções
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilizadores e suas Funções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-slate-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100">{user.name}</h3>
                        <p className="text-sm text-slate-400">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          {user.userRoles && user.userRoles.map((userRole) => (
                            <Badge key={userRole.role.id} variant="outline">
                              {userRole.role.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Gerir Funções
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funções Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRoles.map((role) => (
                  <div key={role.id} className="p-4 border border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-100">{role.name}</h3>
                      <Badge className={getRoleColor(role.baseRole)}>
                        {role.baseRole}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{role.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{role._count.userRoles} utilizadores</span>
                      <span>{role._count.rolePermissions} permissões</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissões do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(
                  permissions.reduce((acc, permission) => {
                    if (!acc[permission.module]) acc[permission.module] = []
                    acc[permission.module].push(permission)
                    return acc
                  }, {} as Record<string, Permission[]>)
                ).map(([module, modulePermissions]) => (
                  <div key={module}>
                    <h3 className="font-semibold text-slate-100 mb-3 capitalize">{module}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {modulePermissions.map((permission) => (
                        <div key={permission.id} className="p-3 border border-slate-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getModuleColor(permission.module)}>
                              {permission.action}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-300">{permission.description}</p>
                          <p className="text-xs text-slate-500 mt-1">{permission.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Role Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Gerir Funções - {selectedUser.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => {
                  const hasRole = selectedUser.userRoles?.some(ur => ur.role.id === role.id) || false
                  return (
                    <div key={role.id} className="flex items-center justify-between p-3 border border-slate-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-100">{role.name}</h4>
                        <p className="text-sm text-slate-400">{role.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={hasRole ? "destructive" : "primary"}
                        onClick={() => hasRole 
                          ? removeRoleFromUser(selectedUser.id, role.id)
                          : assignRoleToUser(selectedUser.id, role.id)
                        }
                      >
                        {hasRole ? (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Remover
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Atribuir
                          </>
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
