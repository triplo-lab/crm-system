"use client"

import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  Edit,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Loader2,
  BarChart3,
  Activity,
  Zap,
  Trash2
} from "lucide-react"
import { MetricsSkeleton } from "@/components/ui/modern-loading"
import Link from "next/link"
import { formatDate, formatCurrency } from "@/lib/utils"

// Lazy load heavy components
const ModernKanbanBoard = lazy(() => import("@/components/kanban/modern-kanban-board").then(module => ({ default: module.ModernKanbanBoard })))
const AdvancedFilters = lazy(() => import("@/components/kanban/advanced-filters").then(module => ({ default: module.AdvancedFilters })))
const KanbanMetrics = lazy(() => import("@/components/kanban/kanban-metrics").then(module => ({ default: module.KanbanMetrics })))
const PipelineCharts = lazy(() => import("@/components/kanban/pipeline-charts").then(module => ({ default: module.PipelineCharts })))
const ActivityFeed = lazy(() => import("@/components/kanban/activity-feed").then(module => ({ default: module.ActivityFeed })))
const AutomationPanel = lazy(() => import("@/components/kanban/automation-panel").then(module => ({ default: module.AutomationPanel })))

import { Lead, KanbanColumn, KanbanFilter, KanbanActivity, KanbanComment, KanbanAutomation } from "@/types/kanban"

export default function LeadsKanbanPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<KanbanFilter>({})
  const [showMetrics, setShowMetrics] = useState(true)
  const [showCharts, setShowCharts] = useState(false)
  const [showActivities, setShowActivities] = useState(false)
  const [showAutomations, setShowAutomations] = useState(false)
  const [activities, setActivities] = useState<KanbanActivity[]>([])
  const [comments, setComments] = useState<KanbanComment[]>([])
  const [automations, setAutomations] = useState<KanbanAutomation[]>([])

  useEffect(() => {
    fetchLeads()
    fetchColumns()

    // Sample activities and comments
    setActivities([
      {
        id: '1',
        leadId: 'sample',
        userId: 'João Silva',
        action: 'created',
        description: 'Lead criado no sistema',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        leadId: 'sample',
        userId: 'Maria Santos',
        action: 'moved',
        fromStatus: 'NEW',
        toStatus: 'CONTACTED',
        description: 'Lead movido para Contactados',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        leadId: 'sample',
        userId: 'Pedro Costa',
        action: 'updated',
        description: 'Valor do lead atualizado para €15.000',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      }
    ])

    setComments([
      {
        id: '1',
        leadId: 'sample',
        userId: 'Ana Rodrigues',
        content: 'Cliente muito interessado no nosso produto. Agendar reunião para próxima semana.',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        leadId: 'sample',
        userId: 'Carlos Ferreira',
        content: 'Enviada proposta comercial por email. Aguardando resposta.',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ])

    // Sample automations
    setAutomations([
      {
        id: '1',
        name: 'Leads Antigos para Perdidos',
        trigger: {
          type: 'time_based',
          conditions: { days: 30, field: 'lastActivity' }
        },
        actions: [{
          type: 'move_to_status',
          parameters: { status: 'LOST' }
        }],
        isActive: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        name: 'Atribuir Leads de Alto Valor',
        trigger: {
          type: 'value_change',
          conditions: { minValue: 10000 }
        },
        actions: [{
          type: 'assign_user',
          parameters: { userId: 'senior-manager' }
        }],
        isActive: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        name: 'Email de Follow-up',
        trigger: {
          type: 'status_change',
          conditions: { fromStatus: 'CONTACTED', toStatus: 'QUALIFIED' }
        },
        actions: [{
          type: 'send_email',
          parameters: { template: 'follow-up', delay: 3 }
        }],
        isActive: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ])
  }, [])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchColumns = async () => {
    try {
      const response = await fetch('/api/kanban-columns?boardType=leads')
      if (response.ok) {
        const data = await response.json()
        setColumns(data || [])
      }
    } catch (error) {
      console.error('Error fetching columns:', error)
      // Set default columns if API fails
      setColumns([
        { id: '1', columnId: 'NEW', title: 'Novos', color: 'bg-blue-500', order: 0, isVisible: true, boardType: 'leads' },
        { id: '2', columnId: 'CONTACTED', title: 'Contactados', color: 'bg-yellow-500', order: 1, isVisible: true, boardType: 'leads' },
        { id: '3', columnId: 'QUALIFIED', title: 'Qualificados', color: 'bg-green-500', order: 2, isVisible: true, boardType: 'leads' },
        { id: '4', columnId: 'PROPOSAL', title: 'Propostas', color: 'bg-purple-500', order: 3, isVisible: true, boardType: 'leads' },
        { id: '5', columnId: 'NEGOTIATION', title: 'Negociação', color: 'bg-orange-500', order: 4, isVisible: true, boardType: 'leads' },
        { id: '6', columnId: 'WON', title: 'Ganhos', color: 'bg-emerald-500', order: 5, isVisible: true, boardType: 'leads' },
        { id: '7', columnId: 'LOST', title: 'Perdidos', color: 'bg-red-500', order: 6, isVisible: true, boardType: 'leads' }
      ])
    }
  }

  // Handle lead movement - memoized for performance
  const handleLeadMove = useCallback(async (leadId: string, newStatus: string, newPosition?: number) => {
    try {
      const lead = leads.find(l => l.id === leadId)
      if (!lead || lead.status === newStatus) return

      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...lead,
          status: newStatus
        })
      })

      if (response.ok) {
        // Update local state
        setLeads(prevLeads =>
          prevLeads.map(l =>
            l.id === leadId
              ? { ...l, status: newStatus as Lead['status'] }
              : l
          )
        )
      }
    } catch (error) {
      console.error('Error updating lead status:', error)
    }
  }, [leads])

  // Function to update a column - memoized for performance
  const handleColumnUpdate = useCallback(async (updatedColumn: KanbanColumn) => {
    try {
      // Update local state immediately for better UX
      setColumns(prevColumns =>
        prevColumns.map(col =>
          col.id === updatedColumn.id ? updatedColumn : col
        )
      )

      // Save to database
      const response = await fetch('/api/kanban-columns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedColumn)
      })

      if (!response.ok) {
        // Revert local state if API call fails
        setColumns(prevColumns =>
          prevColumns.map(col =>
            col.id === updatedColumn.id
              ? { ...updatedColumn, title: col.title, color: col.color } // Revert to original
              : col
          )
        )
        throw new Error('Erro ao salvar alterações da coluna')
      }

      console.log('Coluna atualizada com sucesso:', updatedColumn.title)
    } catch (error) {
      console.error('Error updating column:', error)
      // Show error to user (you can add toast notification here)
    }
  }, [])

  // Handler functions for card actions
  const handleDuplicateLead = async (lead: Lead) => {
    try {
      const duplicatedLead = {
        ...lead,
        name: `${lead.name} (Cópia)`,
        email: `copy_${Date.now()}_${lead.email}`,
        id: undefined // Remove ID so a new one is generated
      }

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(duplicatedLead)
      })

      if (response.ok) {
        const newLead = await response.json()
        setLeads(prev => [...prev, newLead])
      }
    } catch (error) {
      console.error('Error duplicating lead:', error)
    }
  }

  const handleArchiveLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/archive`, {
        method: 'POST'
      })

      if (response.ok) {
        setLeads(prev => prev.filter(lead => lead.id !== leadId))
      }
    } catch (error) {
      console.error('Error archiving lead:', error)
    }
  }

  const handleAssignLead = (leadId: string) => {
    // Open assignment modal or redirect to assignment page
    window.location.href = `/dashboard/leads/${leadId}/edit?tab=assignment`
  }

  const handleCreateProposal = (leadId: string) => {
    // Redirect to create proposal page with lead pre-selected
    window.location.href = `/dashboard/proposals/new?leadId=${leadId}`
  }

  // Apply filters to leads - memoized for performance
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search term filter
      const matchesSearch = !searchTerm ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))

      // Assigned to filter
      const matchesAssignedTo = !filters.assignedTo?.length ||
        (lead.assignedTo && filters.assignedTo.includes(lead.assignedTo))

      // Source filter
      const matchesSource = !filters.source?.length ||
        (lead.source && filters.source.includes(lead.source))

      // Priority filter
      const matchesPriority = !filters.priority?.length ||
        (lead.priority && filters.priority.includes(lead.priority))

      // Value range filter
      const matchesValue = !filters.valueRange ||
        (lead.value && lead.value >= (filters.valueRange.min || 0) &&
         lead.value <= (filters.valueRange.max || Infinity))

      // Probability range filter
      const matchesProbability = !filters.probabilityRange ||
        (lead.probability && lead.probability >= (filters.probabilityRange.min || 0) &&
         lead.probability <= (filters.probabilityRange.max || 100))

      // Date range filter
      const matchesDate = !filters.dateRange ||
        (new Date(lead.createdAt) >= new Date(filters.dateRange.start) &&
         new Date(lead.createdAt) <= new Date(filters.dateRange.end))

      // Tags filter
      const matchesTags = !filters.tags?.length ||
        (lead.tags && filters.tags.some(tag => lead.tags?.includes(tag)))

      return matchesSearch && matchesAssignedTo && matchesSource &&
             matchesPriority && matchesValue && matchesProbability &&
             matchesDate && matchesTags
    })
  }, [leads, searchTerm, filters])

  // Calculate statistics - memoized for performance
  const leadsStats = useMemo(() => {
    const totalValue = filteredLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)
    const averageProbability = filteredLeads.length > 0
      ? filteredLeads.reduce((sum, lead) => sum + (lead.probability || 0), 0) / filteredLeads.length
      : 0
    const totalCount = filteredLeads.length
    const highValueLeads = filteredLeads.filter(lead => (lead.value || 0) > 10000).length

    return {
      totalValue,
      averageProbability,
      totalCount,
      highValueLeads
    }
  }, [filteredLeads])

  // Get unique values for filter options - memoized for performance
  const availableUsers = useMemo(() =>
    [...new Set(leads.map(lead => lead.assignedTo).filter(Boolean))] as string[],
    [leads]
  )
  const availableSources = useMemo(() =>
    [...new Set(leads.map(lead => lead.source).filter(Boolean))] as string[],
    [leads]
  )
  const availableTags = useMemo(() =>
    [...new Set(leads.flatMap(lead => lead.tags || []))] as string[],
    [leads]
  )

  if (loading) {
    return (
      <DashboardLayout title="Pipeline de Leads">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Pipeline de Leads">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex items-center gap-4 flex-1 w-full lg:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Pesquisar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex-shrink-0">
              <Suspense fallback={<div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}>
                <AdvancedFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableUsers={availableUsers}
                  availableSources={availableSources}
                  availableTags={availableTags}
                />
              </Suspense>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <Link href="/dashboard/leads/trash">
              <Button variant="outline" className="gap-2 whitespace-nowrap">
                <Trash2 className="w-4 h-4" />
                Lixeira
              </Button>
            </Link>
            <Button
              onClick={() => router.push('/dashboard/leads/new')}
              className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between bg-slate-800/30 rounded-lg px-4 py-2 border border-slate-700/50">
          <div className="flex items-center gap-1">
            <Button
              variant={showMetrics ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowMetrics(!showMetrics)}
              className="gap-1.5 h-7 px-3 text-xs"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Métricas
            </Button>
            <Button
              variant={showCharts ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowCharts(!showCharts)}
              className="gap-1.5 h-7 px-3 text-xs"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Gráficos
            </Button>
            <Button
              variant={showActivities ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowActivities(!showActivities)}
              className="gap-1.5 h-7 px-3 text-xs"
            >
              <Activity className="w-3.5 h-3.5" />
              Atividades
            </Button>
            <Button
              variant={showAutomations ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowAutomations(!showAutomations)}
              className="gap-1.5 h-7 px-3 text-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              Automações
            </Button>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>{leadsStats.totalCount} leads</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{formatCurrency(leadsStats.totalValue)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>{leadsStats.averageProbability.toFixed(0)}% prob. média</span>
            </div>
          </div>
        </div>

        {/* Metrics Dashboard */}
        {loading && showMetrics ? (
          <MetricsSkeleton />
        ) : showMetrics ? (
          <Suspense fallback={<MetricsSkeleton />}>
            <KanbanMetrics
              leads={filteredLeads}
              columns={columns}
              isVisible={showMetrics}
            />
          </Suspense>
        ) : null}

        {/* Pipeline Charts */}
        {showCharts && (
          <div className="mb-6">
            <Suspense fallback={<MetricsSkeleton />}>
              <PipelineCharts
                leads={filteredLeads}
                columns={columns}
                isVisible={true}
              />
            </Suspense>
          </div>
        )}

        {/* Modern Kanban Board */}
        <Suspense fallback={<MetricsSkeleton />}>
          <ModernKanbanBoard
            leads={filteredLeads}
            columns={columns}
            onLeadMove={handleLeadMove}
            onColumnUpdate={handleColumnUpdate}
            onAddLead={(status) => router.push(`/dashboard/leads/new?status=${status}`)}
            onDuplicateLead={handleDuplicateLead}
            onArchiveLead={handleArchiveLead}
            onAssignLead={handleAssignLead}
            onCreateProposal={handleCreateProposal}
            searchTerm=""
            loading={loading}
          />
        </Suspense>

        {/* Activity Feed */}
        {showActivities && (
          <div className="mb-6">
            <Suspense fallback={<MetricsSkeleton />}>
              <ActivityFeed
                activities={activities}
                comments={comments}
                isVisible={true}
                onAddComment={async (content) => {
                  const newComment: KanbanComment = {
                    id: Date.now().toString(),
                    leadId: 'sample',
                    userId: 'Utilizador Atual',
                    content,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }
                  setComments(prev => [newComment, ...prev])
                }}
              />
            </Suspense>
          </div>
        )}

        {/* Automation Panel */}
        {showAutomations && (
          <div className="mb-6">
            <Suspense fallback={<MetricsSkeleton />}>
              <AutomationPanel
                automations={automations}
                isVisible={true}
                onCreateAutomation={(automation) => {
                  const newAutomation: KanbanAutomation = {
                    ...automation,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString()
                  }
                  setAutomations(prev => [...prev, newAutomation])
                }}
                onToggleAutomation={(id, isActive) => {
                  setAutomations(prev => prev.map(auto =>
                    auto.id === id ? { ...auto, isActive } : auto
                  ))
                }}
                onDeleteAutomation={(id) => {
                  setAutomations(prev => prev.filter(auto => auto.id !== id))
                }}
              />
            </Suspense>
          </div>
        )}

        {/* Empty State */}
        {filteredLeads.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-3">
              {(searchTerm || Object.keys(filters).length > 0) ? "Nenhum lead encontrado" : "Nenhum lead adicionado"}
            </h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              {(searchTerm || Object.keys(filters).length > 0)
                ? "Tente ajustar a pesquisa ou filtros para encontrar os leads que procura"
                : "Comece a construir o seu pipeline de vendas adicionando o primeiro lead"}
            </p>
            {!(searchTerm || Object.keys(filters).length > 0) && (
              <Link href="/dashboard/leads/new">
                <Button className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Plus className="w-4 h-4" />
                  Adicionar Primeiro Lead
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
