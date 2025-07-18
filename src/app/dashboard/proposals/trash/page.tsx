'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Search,
  RotateCcw,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Mail,
  FileText,
  DollarSign
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface TrashedProposal {
  id: string
  title: string
  description?: string
  status: string
  total?: number
  currency?: string
  validUntil?: string
  deletedAt: string
  deletedBy?: string
  createdAt: string
  client?: {
    id: string
    name: string
    email: string
  }
  lead?: {
    id: string
    name: string
    email: string
  }
  project?: {
    id: string
    name: string
  }
  creator?: {
    id: string
    name: string
    email: string
  }
  deletedByUser?: {
    id: string
    name: string
    email: string
  }
}

export default function ProposalsTrashPage() {
  const router = useRouter()
  const [proposals, setProposals] = useState<TrashedProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [restoring, setRestoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchTrashedProposals()
  }, [])

  const fetchTrashedProposals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/proposals/trash')
      if (response.ok) {
        const data = await response.json()
        setProposals(data.proposals || [])
      } else {
        console.error('Failed to fetch trashed proposals:', response.status)
      }
    } catch (error) {
      console.error('Error fetching trashed proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId)
    const confirmed = window.confirm(
      `Restaurar a proposta "${proposal?.title}" da lixeira?\n\nEla voltará a aparecer na lista principal de propostas.`
    )
    
    if (!confirmed) return

    try {
      setRestoring(proposalId)
      const response = await fetch(`/api/proposals/${proposalId}/trash`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProposals(prev => prev.filter(p => p.id !== proposalId))
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao restaurar proposta')
      }
    } catch (error) {
      console.error('Error restoring proposal:', error)
      alert('Erro ao restaurar proposta')
    } finally {
      setRestoring(null)
    }
  }

  const handlePermanentDelete = async (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId)
    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: Eliminar PERMANENTEMENTE a proposta "${proposal?.title}"?\n\nEsta ação NÃO PODE ser desfeita!\n\nTodos os dados da proposta serão perdidos para sempre.`
    )
    
    if (!confirmed) return

    try {
      setDeleting(proposalId)
      const response = await fetch(`/api/proposals/trash?id=${proposalId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProposals(prev => prev.filter(p => p.id !== proposalId))
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao eliminar proposta permanentemente')
      }
    } catch (error) {
      console.error('Error permanently deleting proposal:', error)
      alert('Erro ao eliminar proposta permanentemente')
    } finally {
      setDeleting(null)
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

  const filteredProposals = proposals.filter(proposal =>
    proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.lead?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout title="Lixeira - Propostas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/proposals">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar às Propostas
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <Trash2 className="w-6 h-6" />
                Lixeira de Propostas
              </h1>
              <p className="text-slate-400">
                Propostas eliminadas ({proposals.length})
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Pesquisar propostas na lixeira..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-slate-400">A carregar propostas da lixeira...</p>
            </CardContent>
          </Card>
        ) : filteredProposals.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <Trash2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                {searchTerm ? 'Nenhuma proposta encontrada' : 'Lixeira vazia'}
              </h3>
              <p className="text-slate-400 mb-6">
                {searchTerm 
                  ? 'Tente ajustar o termo de pesquisa'
                  : 'Não há propostas na lixeira'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProposals.map((proposal) => (
              <Card key={proposal.id} variant="elevated" className="hover:border-slate-600/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Title and Status */}
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-slate-100">
                          {proposal.title}
                        </h3>
                        <Badge className={`border ${getStatusColor(proposal.status)}`}>
                          {getStatusText(proposal.status)}
                        </Badge>
                      </div>

                      {/* Description */}
                      {proposal.description && (
                        <p className="text-sm text-slate-400 line-clamp-2">
                          {proposal.description}
                        </p>
                      )}

                      {/* Details */}
                      <div className="flex items-center gap-6 text-sm text-slate-400">
                        {proposal.client && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Cliente: {proposal.client.name}</span>
                          </div>
                        )}
                        {proposal.lead && !proposal.client && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Lead: {proposal.lead.name}</span>
                          </div>
                        )}
                        {proposal.total && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatCurrency(proposal.total, proposal.currency)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Eliminada: {formatDate(proposal.deletedAt)}</span>
                        </div>
                        {proposal.deletedByUser && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Por: {proposal.deletedByUser.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(proposal.id)}
                        disabled={restoring === proposal.id}
                        className="gap-2 border-green-500 text-green-400 hover:bg-green-500/10"
                      >
                        {restoring === proposal.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        {restoring === proposal.id ? 'A restaurar...' : 'Restaurar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePermanentDelete(proposal.id)}
                        disabled={deleting === proposal.id}
                        className="gap-2 border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        {deleting === proposal.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        {deleting === proposal.id ? 'A eliminar...' : 'Eliminar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
