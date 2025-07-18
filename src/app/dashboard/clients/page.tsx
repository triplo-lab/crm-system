"use client"

import { useEffect, useState, memo, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Building,
  Building2,
  MapPin,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  FolderOpen
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  city?: string
  country?: string
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT'
  projectsCount: number
  activeProjectsCount: number
  createdAt: string
  updatedAt: string
}

// Optimized ClientCard component
const ClientCard = memo(function ClientCard({
  client,
  onDelete,
  isDeleting
}: {
  client: Client
  onDelete: (clientId: string) => void
  isDeleting: boolean
}) {
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'INACTIVE':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'PROSPECT':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }, [])

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo'
      case 'INACTIVE':
        return 'Inativo'
      case 'PROSPECT':
        return 'Prospeto'
      default:
        return status
    }
  }, [])

  return (
    <Card variant="elevated" hover>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg line-clamp-1">{client.name}</CardTitle>
            {client.company && (
              <CardDescription className="line-clamp-1">
                {client.company}
              </CardDescription>
            )}
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(client.status)}`}>
            {getStatusText(client.status)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 truncate">{client.email}</span>
          </div>
          {client.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">{client.phone}</span>
            </div>
          )}
          {client.company && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 truncate">{client.company}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{client.projectsCount} projetos</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{client.activeProjectsCount} ativos</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/dashboard/clients/${client.id}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/clients/${client.id}/edit`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => onDelete(client.id)}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deletingClient, setDeletingClient] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<{
    show: boolean
    title: string
    message: string
    suggestions?: string[]
  }>({
    show: false,
    title: '',
    message: '',
    suggestions: []
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'INACTIVE':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'PROSPECT':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
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
      case 'PROSPECT':
        return 'Prospeto'
      default:
        return status
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    setDeletingClient(clientId)
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Handle specific error cases
        if (response.status === 400 && errorData.error?.includes('projetos ou leads associados')) {
          // Show detailed error with suggestions
          const client = clients.find(c => c.id === clientId)
          const clientName = client?.name || 'cliente'

          setDeleteError({
            show: true,
            title: `Não é possível eliminar ${clientName}`,
            message: 'Este cliente tem projetos ou leads associados que impedem a sua eliminação.',
            suggestions: [
              'Primeiro elimine ou transfira os projetos associados',
              'Elimine ou transfira os leads associados',
              'Depois tente eliminar o cliente novamente',
              'Verifique a página de detalhes do cliente para ver todos os dados associados'
            ]
          })
        } else {
          // Generic error
          setDeleteError({
            show: true,
            title: 'Erro ao eliminar cliente',
            message: errorData.error || 'Ocorreu um erro inesperado ao tentar eliminar o cliente.',
            suggestions: ['Tente novamente em alguns momentos', 'Verifique sua conexão com a internet']
          })
        }

        setShowDeleteConfirm(null)
        return
      }

      // Remove client from local state
      setClients(prev => prev.filter(client => client.id !== clientId))
      setShowDeleteConfirm(null)

    } catch (error) {
      console.error('Error deleting client:', error)
      setDeleteError({
        show: true,
        title: 'Erro de conexão',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        suggestions: ['Verifique sua conexão com a internet', 'Tente novamente em alguns momentos']
      })
    } finally {
      setDeletingClient(null)
    }
  }

  // Filter clients - memoized for performance
  const filteredClients = useMemo(() => {
    if (!Array.isArray(clients)) return []

    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === "all" || client.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [clients, searchTerm, statusFilter])

  if (loading) {
    return (
      <DashboardLayout title="Clientes">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Clientes">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Pesquisar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Estados</option>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="PROSPECT">Prospeto</option>
            </select>
          </div>
          <Link href="/dashboard/clients/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </Link>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onDelete={() => setShowDeleteConfirm(client.id)}
              isDeleting={deletingClient === client.id}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              {searchTerm || statusFilter !== "all" ? "Nenhum cliente encontrado" : "Nenhum cliente adicionado"}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || statusFilter !== "all" 
                ? "Tente ajustar os filtros de pesquisa" 
                : "Comece adicionando o seu primeiro cliente"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Link href="/dashboard/clients/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Primeiro Cliente
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Confirmar Eliminação
                  </h3>
                  <p className="text-sm text-slate-400">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              </div>

              {(() => {
                const client = clients.find(c => c.id === showDeleteConfirm)
                return (
                  <div>
                    <p className="text-slate-300 mb-6">
                      Tem certeza que deseja eliminar o cliente <strong>{client?.name}</strong>?
                      {client?.activeProjectsCount && client.activeProjectsCount > 0 && (
                        <span className="block text-yellow-400 text-sm mt-2">
                          ⚠️ Este cliente tem {client.activeProjectsCount} projeto(s) ativo(s)
                        </span>
                      )}
                    </p>

                    <div className="flex items-center justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(null)}
                        disabled={deletingClient === showDeleteConfirm}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteClient(showDeleteConfirm)}
                        disabled={deletingClient === showDeleteConfirm}
                      >
                        {deletingClient === showDeleteConfirm ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            A eliminar...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar Cliente
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Error Modal */}
        {deleteError.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      {deleteError.title}
                    </h3>
                  </div>
                </div>

                <p className="text-slate-300 mb-4">
                  {deleteError.message}
                </p>

                {deleteError.suggestions && deleteError.suggestions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-200 mb-2">
                      Como resolver:
                    </h4>
                    <ul className="space-y-1">
                      {deleteError.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => setDeleteError({ show: false, title: '', message: '', suggestions: [] })}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-100"
                  >
                    Entendi
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
