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
  FileText,
  User,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Settings,
  Check,
  X,
  Trash2,
  Shield,
  UserCheck
} from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"

interface Proposal {
  id: string
  title: string
  description?: string
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  total?: number
  currency: string
  validUntil?: string
  clientId?: string
  leadId?: string
  projectId?: string
  createdBy: string
  sentAt?: string
  acceptedAt?: string
  rejectedAt?: string
  adminApproved: boolean
  adminApprovedAt?: string
  clientApproved: boolean
  clientApprovedAt?: string
  createdAt: string
  updatedAt: string
  client?: {
    id: string
    name: string
  }
  lead?: {
    id: string
    name: string
  }
  project?: {
    id: string
    name: string
  }
  creator: {
    id: string
    name: string
  }
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [movingToTrash, setMovingToTrash] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchProposals()
  }, [])

  const fetchProposals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/proposals')
      if (response.ok) {
        const data = await response.json()
        setProposals(data.proposals || [])
      }
    } catch (error) {
      console.error('Error fetching proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      case 'SENT':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'VIEWED':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'ACCEPTED':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'REJECTED':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'EXPIRED':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-4 h-4" />
      case 'SENT':
        return <Send className="w-4 h-4" />
      case 'VIEWED':
        return <Eye className="w-4 h-4" />
      case 'ACCEPTED':
        return <CheckCircle className="w-4 h-4" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />
      case 'EXPIRED':
        return <Clock className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Rascunho'
      case 'SENT': return 'Enviada'
      case 'VIEWED': return 'Visualizada'
      case 'ACCEPTED': return 'Aceite'
      case 'REJECTED': return 'Rejeitada'
      case 'EXPIRED': return 'Expirada'
      default: return status
    }
  }

  const handleMoveToTrash = async (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId)
    const confirmed = window.confirm(
      `Tem certeza que deseja mover a proposta "${proposal?.title}" para a lixeira?\n\nPoderá restaurá-la posteriormente.`
    )

    if (!confirmed) return

    try {
      setMovingToTrash(proposalId)
      const response = await fetch(`/api/proposals/${proposalId}/trash`, {
        method: 'POST'
      })

      if (response.ok) {
        // Remove proposal from local state
        setProposals(prev => prev.filter(p => p.id !== proposalId))
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao mover proposta para a lixeira')
      }
    } catch (error) {
      console.error('Error moving proposal to trash:', error)
      alert('Erro ao mover proposta para a lixeira')
    } finally {
      setMovingToTrash(null)
    }
  }

  const handleDelete = async (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId)
    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: Eliminar permanentemente a proposta "${proposal?.title}"?\n\nEsta ação NÃO PODE ser desfeita!\n\nTodos os dados da proposta serão perdidos para sempre.`
    )

    if (!confirmed) return

    try {
      setDeleting(proposalId)
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove proposal from local state
        setProposals(prev => prev.filter(p => p.id !== proposalId))
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao eliminar proposta')
      }
    } catch (error) {
      console.error('Error deleting proposal:', error)
      alert('Erro ao eliminar proposta')
    } finally {
      setDeleting(null)
    }
  }

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.lead?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || proposal.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <DashboardLayout title="Propostas">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Propostas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Propostas</h1>
            <p className="text-slate-400">Gerir propostas comerciais</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/proposals/trash">
              <Button variant="outline" className="gap-2 border-orange-500 text-orange-400 hover:bg-orange-500/10">
                <Trash2 className="w-4 h-4" />
                Lixeira
              </Button>
            </Link>
            <Link href="/dashboard/proposals/settings">
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Configurações
              </Button>
            </Link>
            <Link href="/dashboard/proposals/new">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Nova Proposta
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Pesquisar propostas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="DRAFT">Rascunho</option>
                  <option value="SENT">Enviada</option>
                  <option value="VIEWED">Visualizada</option>
                  <option value="ACCEPTED">Aceite</option>
                  <option value="REJECTED">Rejeitada</option>
                  <option value="EXPIRED">Expirada</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proposals List */}
        {filteredProposals.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                {searchTerm || statusFilter !== "all" ? "Nenhuma proposta encontrada" : "Nenhuma proposta criada"}
              </h3>
              <p className="text-slate-400 mb-6">
                {searchTerm || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de pesquisa"
                  : "Comece criando a sua primeira proposta comercial"
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Link href="/dashboard/proposals/new">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Primeira Proposta
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card variant="elevated">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-4 text-sm font-medium text-slate-300">Proposta</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-300">Cliente/Lead</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-300">Status</th>
                      <th className="text-center p-4 text-sm font-medium text-slate-300">Aprovações</th>
                      <th className="text-right p-4 text-sm font-medium text-slate-300">Valor</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-300">Data</th>
                      <th className="text-center p-4 text-sm font-medium text-slate-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProposals.map((proposal) => (
                      <tr key={proposal.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors group">
                        <td className="p-4">
                          <div>
                            <Link
                              href={`/dashboard/proposals/${proposal.id}`}
                              className="text-slate-100 font-medium hover:text-blue-400 transition-colors"
                            >
                              {proposal.title}
                            </Link>
                            {proposal.description && (
                              <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                                {proposal.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            {proposal.client && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-3 h-3 text-blue-400" />
                                <span className="text-slate-300">{proposal.client.name}</span>
                              </div>
                            )}
                            {proposal.lead && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-3 h-3 text-orange-400" />
                                <span className="text-slate-300">{proposal.lead.name}</span>
                              </div>
                            )}
                            {proposal.project && (
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="w-3 h-3 text-purple-400" />
                                <span className="text-slate-300">{proposal.project.name}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                            {getStatusIcon(proposal.status)}
                            {getStatusText(proposal.status)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center gap-1" title="Aprovação do Administrador">
                              <Shield className="w-4 h-4 text-blue-400" />
                              {proposal.adminApproved ? (
                                <div className="flex items-center justify-center w-6 h-6 bg-green-100 border border-green-300 rounded-full">
                                  <Check className="w-3 h-3 text-green-600" />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center w-6 h-6 bg-red-50 border border-red-200 rounded-full">
                                  <X className="w-3 h-3 text-red-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1" title="Aprovação do Cliente">
                              <UserCheck className="w-4 h-4 text-green-400" />
                              {proposal.clientApproved ? (
                                <div className="flex items-center justify-center w-6 h-6 bg-green-100 border border-green-300 rounded-full">
                                  <Check className="w-3 h-3 text-green-600" />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center w-6 h-6 bg-red-50 border border-red-200 rounded-full">
                                  <X className="w-3 h-3 text-red-500" />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="text-slate-100 font-medium">
                              {proposal.total ? formatCurrency(proposal.total) : 'Sem valor'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400">{formatDate(proposal.createdAt)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/dashboard/proposals/${proposal.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Visualizar">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/proposals/${proposal.id}/edit`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:text-orange-400 hover:bg-orange-500/10"
                              onClick={() => handleMoveToTrash(proposal.id)}
                              disabled={movingToTrash === proposal.id}
                              title="Mover para lixeira"
                            >
                              {movingToTrash === proposal.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDelete(proposal.id)}
                              disabled={deleting === proposal.id}
                              title="Eliminar permanentemente"
                            >
                              {deleting === proposal.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
