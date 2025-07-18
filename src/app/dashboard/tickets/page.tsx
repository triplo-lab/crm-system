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
  MessageSquare,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Eye,
  Edit,
  Paperclip
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface Ticket {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_RESPONSE' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: string
  client: {
    id: string
    name: string
    company?: string
  }
  assignedTo?: {
    id: string
    name: string
  }
  createdBy: {
    id: string
    name: string
  }
  commentsCount: number
  attachmentsCount: number
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tickets')
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'IN_PROGRESS':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'WAITING_RESPONSE':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'RESOLVED':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'CLOSED':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'Aberto'
      case 'IN_PROGRESS':
        return 'Em Progresso'
      case 'WAITING_RESPONSE':
        return 'Aguarda Resposta'
      case 'RESOLVED':
        return 'Resolvido'
      case 'CLOSED':
        return 'Fechado'
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-400'
      case 'HIGH':
        return 'text-orange-400'
      case 'MEDIUM':
        return 'text-yellow-400'
      case 'LOW':
        return 'text-green-400'
      default:
        return 'text-slate-400'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'Urgente'
      case 'HIGH':
        return 'Alta'
      case 'MEDIUM':
        return 'Média'
      case 'LOW':
        return 'Baixa'
      default:
        return priority
    }
  }

  const filteredTickets = Array.isArray(tickets) ? tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  }) : []

  if (loading) {
    return (
      <DashboardLayout title="Tickets de Suporte">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Tickets de Suporte">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Pesquisar tickets..."
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
              <option value="OPEN">Aberto</option>
              <option value="IN_PROGRESS">Em Progresso</option>
              <option value="WAITING_RESPONSE">Aguarda Resposta</option>
              <option value="RESOLVED">Resolvido</option>
              <option value="CLOSED">Fechado</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Média</option>
              <option value="LOW">Baixa</option>
            </select>
          </div>
          <Link href="/dashboard/tickets/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Ticket
            </Button>
          </Link>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} variant="elevated" hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-100 line-clamp-1">
                          {ticket.title}
                        </h3>
                        <p className="text-slate-400 text-sm line-clamp-2 mt-1">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityText(ticket.priority)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {ticket.client.name}
                        {ticket.client.company && ` - ${ticket.client.company}`}
                      </div>
                      
                      {ticket.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Atribuído a: {ticket.assignedTo.name}
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(ticket.createdAt)}
                      </div>

                      {ticket.commentsCount > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {ticket.commentsCount} comentário{ticket.commentsCount !== 1 ? 's' : ''}
                        </div>
                      )}

                      {ticket.attachmentsCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="w-4 h-4" />
                          {ticket.attachmentsCount} anexo{ticket.attachmentsCount !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link href={`/dashboard/tickets/${ticket.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                    </Link>
                    <Link href={`/dashboard/tickets/${ticket.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredTickets.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all" ? "Nenhum ticket encontrado" : "Nenhum ticket criado"}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                ? "Tente ajustar os filtros de pesquisa" 
                : "Comece criando o seu primeiro ticket de suporte"}
            </p>
            {!searchTerm && statusFilter === "all" && priorityFilter === "all" && (
              <Link href="/dashboard/tickets/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Ticket
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
