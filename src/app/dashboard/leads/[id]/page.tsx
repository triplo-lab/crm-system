"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  DollarSign,
  Target,
  FileText,
  UserPlus,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { formatDate, formatCurrency } from "@/lib/utils"

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  source?: string
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'
  value?: number
  probability?: number
  expectedCloseDate?: string
  assignedTo?: string
  assigneeName?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface Proposal {
  id: string
  title: string
  status: string
  total?: number
  createdAt: string
}

export default function LeadDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchLead()
      fetchProposals()
    }
  }, [params.id])

  const fetchLead = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leads/${params.id}`)
      if (response.ok) {
        const leadData = await response.json()
        setLead(leadData)
      } else {
        console.error('Failed to fetch lead')
        router.push('/dashboard/leads')
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
      router.push('/dashboard/leads')
    } finally {
      setLoading(false)
    }
  }

  const fetchProposals = async () => {
    try {
      const response = await fetch(`/api/proposals?leadId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        // Filter proposals that belong to this lead
        const leadProposals = data.proposals?.filter((proposal: any) => proposal.leadId === params.id) || []
        setProposals(leadProposals)
      }
    } catch (error) {
      console.error('Error fetching proposals:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja eliminar este lead?')) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/leads/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/dashboard/leads')
      } else {
        alert('Erro ao eliminar lead')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      alert('Erro ao eliminar lead')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'CONTACTED':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'QUALIFIED':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'PROPOSAL':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'NEGOTIATION':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'WON':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'LOST':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW': return 'Novo'
      case 'CONTACTED': return 'Contactado'
      case 'QUALIFIED': return 'Qualificado'
      case 'PROPOSAL': return 'Proposta'
      case 'NEGOTIATION': return 'Negociação'
      case 'WON': return 'Ganho'
      case 'LOST': return 'Perdido'
      default: return status
    }
  }

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      case 'SENT':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
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

  const getProposalStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Rascunho'
      case 'SENT':
        return 'Enviada'
      case 'ACCEPTED':
        return 'Aceite'
      case 'REJECTED':
        return 'Rejeitada'
      case 'EXPIRED':
        return 'Expirada'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Detalhes do Lead">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  if (!lead) {
    return (
      <DashboardLayout title="Lead não encontrado">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Lead não encontrado</h2>
          <Link href="/dashboard/leads">
            <Button variant="outline">Voltar aos Leads</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Detalhes do Lead">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Compacto */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/leads">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              {/* Avatar Menor */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">{lead.name}</h1>
                <p className="text-sm text-slate-400">{lead.company || lead.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(lead.status)}`}>
              {getStatusLabel(lead.status)}
            </span>
            <Link href={`/dashboard/leads/${lead.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Conteúdo Principal Compacto */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-3">
            <Card variant="elevated" className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Informações do Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Contacto */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      Contacto
                    </h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-900/50 rounded-lg">
                        <div className="text-xs text-slate-400">Email</div>
                        <div className="text-sm text-slate-100 font-medium">{lead.email}</div>
                      </div>
                      {lead.phone && (
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400">Telefone</div>
                          <div className="text-sm text-slate-100 font-medium">{lead.phone}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Empresa */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-400" />
                      Empresa
                    </h4>
                    <div className="space-y-2">
                      {lead.company && (
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400">Nome</div>
                          <div className="text-sm text-slate-100 font-medium">{lead.company}</div>
                        </div>
                      )}
                      {lead.source && (
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400">Fonte</div>
                          <div className="text-sm text-slate-100 font-medium">{lead.source}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vendas */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      Vendas
                    </h4>
                    <div className="space-y-2">
                      {lead.value && (
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400">Valor</div>
                          <div className="text-sm text-slate-100 font-medium">{formatCurrency(lead.value)}</div>
                        </div>
                      )}
                      {lead.probability && (
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400">Probabilidade</div>
                          <div className="text-sm text-slate-100 font-medium">{lead.probability}%</div>
                        </div>
                      )}
                      {lead.expectedCloseDate && (
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400">Fecho Previsto</div>
                          <div className="text-sm text-slate-100 font-medium">{formatDate(lead.expectedCloseDate)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Compacta */}
          <div className="space-y-4">
            {/* Ações */}
            <Card variant="elevated" className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
                <Button size="sm" variant="outline" className="w-full gap-2">
                  <Phone className="w-4 h-4" />
                  Ligar
                </Button>
                <Button size="sm" variant="outline" className="w-full gap-2">
                  <Calendar className="w-4 h-4" />
                  Reunião
                </Button>
              </CardContent>
            </Card>

            {/* Informações Adicionais */}
            <Card variant="elevated" className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">Criado</div>
                    <div className="text-slate-100">{formatDate(lead.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Atualizado</div>
                    <div className="text-slate-100">{formatDate(lead.updatedAt)}</div>
                  </div>
                  {lead.assigneeName && (
                    <div className="col-span-2">
                      <div className="text-xs text-slate-400">Responsável</div>
                      <div className="text-slate-100">{lead.assigneeName}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Propostas Associadas */}
        <Card variant="elevated" className="bg-slate-800/30 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Propostas Associadas ({proposals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proposals.length > 0 ? (
              <div className="space-y-3">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Link href={`/dashboard/proposals/${proposal.id}`} className="text-sm font-medium text-slate-100 hover:text-blue-400 transition-colors">
                          {proposal.title}
                        </Link>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-slate-400">
                            {formatDate(proposal.createdAt)}
                          </span>
                          {proposal.total && (
                            <span className="text-xs text-green-400">
                              {formatCurrency(proposal.total)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getProposalStatusColor(proposal.status)}`}>
                          {getProposalStatusText(proposal.status)}
                        </span>
                        <Link href={`/dashboard/proposals/${proposal.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowLeft className="w-3 h-3 rotate-180" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Nenhuma proposta associada a este lead</p>
                <Link href={`/dashboard/proposals/new?leadId=${lead.id}`}>
                  <Button variant="outline" size="sm" className="mt-3 gap-2">
                    <FileText className="w-4 h-4" />
                    Criar Proposta
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notas (se existirem) */}
        {lead.notes && (
          <Card variant="elevated" className="bg-slate-800/30 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-400" />
                Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
