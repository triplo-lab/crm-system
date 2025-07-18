'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building,
  Globe,
  MapPin,
  Calendar,
  User,
  FileText,
  Loader2,
  AlertCircle,
  Trash2
} from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  website?: string
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT'
  source?: string
  assignedTo?: string
  notes?: string
  createdAt: string
  updatedAt: string
  assignee?: {
    id: string
    name: string
    email: string
  }
  projects?: Array<{
    id: string
    name: string
    status: string
  }>
  _count?: {
    projects: number
  }
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchClient(params.id as string)
    }
  }, [params.id])

  const fetchClient = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clients/${id}`)
      
      if (!response.ok) {
        throw new Error('Cliente não encontrado')
      }
      
      const data = await response.json()
      setClient(data)
    } catch (error) {
      console.error('Error fetching client:', error)
      setError(error instanceof Error ? error.message : 'Erro ao carregar cliente')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'INACTIVE':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'PROSPECT':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
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

  const handleDelete = async () => {
    if (!client) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao eliminar cliente')
      }

      // Redirect to clients list after successful deletion
      router.push('/dashboard/clients')
    } catch (error) {
      console.error('Error deleting client:', error)
      setError(error instanceof Error ? error.message : 'Erro ao eliminar cliente')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>A carregar cliente...</span>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            {error || 'Cliente não encontrado'}
          </h3>
          <p className="text-slate-400 mb-4">
            O cliente que procura não existe ou foi removido.
          </p>
          <Link href="/dashboard/clients">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Clientes
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{client.name}</h1>
            <p className="text-slate-400">{client.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(client.status)}>
            {getStatusText(client.status)}
          </Badge>
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalhes do Cliente */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Email</label>
                  <div className="flex items-center gap-2 text-slate-100">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{client.email}</span>
                  </div>
                </div>
                
                {client.phone && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Telefone</label>
                    <div className="flex items-center gap-2 text-slate-100">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                  </div>
                )}

                {client.company && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Empresa</label>
                    <div className="flex items-center gap-2 text-slate-100">
                      <Building className="w-4 h-4 text-slate-400" />
                      <span>{client.company}</span>
                    </div>
                  </div>
                )}

                {client.website && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Website</label>
                    <div className="flex items-center gap-2 text-slate-100">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <a 
                        href={client.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {client.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {client.address && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Endereço</label>
                  <div className="flex items-center gap-2 text-slate-100">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{client.address}</span>
                  </div>
                </div>
              )}

              {client.notes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Notas</label>
                  <div className="flex items-start gap-2 text-slate-100">
                    <FileText className="w-4 h-4 text-slate-400 mt-1" />
                    <p className="whitespace-pre-wrap">{client.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projetos */}
          {client.projects && client.projects.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Projetos ({client.projects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {client.projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-100">{project.name}</h4>
                        <p className="text-sm text-slate-400">Status: {project.status}</p>
                      </div>
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver Projeto
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Responsável */}
          {client.assignee && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100 text-sm">Responsável</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {client.assignee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">{client.assignee.name}</p>
                    <p className="text-sm text-slate-400">{client.assignee.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações Adicionais */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100 text-sm">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.source && (
                <div>
                  <label className="text-xs font-medium text-slate-400">Origem</label>
                  <p className="text-sm text-slate-100">{client.source}</p>
                </div>
              )}
              
              <div>
                <label className="text-xs font-medium text-slate-400">Criado em</label>
                <div className="flex items-center gap-2 text-sm text-slate-100">
                  <Calendar className="w-3 h-3" />
                  {new Date(client.createdAt).toLocaleDateString('pt-PT')}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-400">Atualizado em</label>
                <div className="flex items-center gap-2 text-sm text-slate-100">
                  <Calendar className="w-3 h-3" />
                  {new Date(client.updatedAt).toLocaleDateString('pt-PT')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
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

            <p className="text-slate-300 mb-6">
              Tem certeza que deseja eliminar o cliente <strong>{client?.name}</strong>?
              {client?._count?.projects && client._count.projects > 0 && (
                <span className="block text-yellow-400 text-sm mt-2">
                  ⚠️ Este cliente tem {client._count.projects} projeto(s) associado(s)
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
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
        </div>
      )}
    </div>
  )
}
