"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  DollarSign,
  Target,
  FileText,
  Timer
} from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description: string
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startDate: string
  endDate: string | null
  budget: number
  actualCost: number
  progress: number
  client: {
    id: string
    name: string
    company?: string
    email: string
  }
  manager: {
    id: string
    name: string
    email: string
  }
  tasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    dueDate: string | null
    assignee: {
      id: string
      name: string
    } | null
  }>
  proposals: Array<{
    id: string
    title: string
    status: string
    total: number
  }>
  timeEntries: Array<{
    id: string
    hours: number
    description: string
    date: string
    user: {
      id: string
      name: string
    }
  }>
  totalHours: number
  tasksCount: number
  completedTasksCount: number
  createdAt: string
  updatedAt: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<{
    show: boolean
    title: string
    message: string
    suggestions?: string[]
    canForceDelete?: boolean
  }>({
    show: false,
    title: '',
    message: '',
    suggestions: [],
    canForceDelete: false
  })
  const [forceDeleting, setForceDeleting] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [params.id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        console.error('Failed to fetch project:', response.status)
        router.push('/dashboard/projects')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      router.push('/dashboard/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    const confirmed = window.confirm(
      `Tem certeza que deseja eliminar o projeto "${project.name}"?\n\nEsta ação não pode ser desfeita.`
    )

    if (!confirmed) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/dashboard/projects')
      } else {
        const errorData = await response.json()

        // Handle specific error cases
        if (response.status === 400 && errorData.details) {
          // Show detailed error with suggestions
          const filteredSuggestions = []
          if (errorData.details.tasks > 0) {
            filteredSuggestions.push(`Elimine ou transfira as ${errorData.details.tasks} tarefa(s) associada(s)`)
          }
          if (errorData.details.timeEntries > 0) {
            filteredSuggestions.push(`Elimine ou transfira as ${errorData.details.timeEntries} entrada(s) de tempo`)
          }
          if (errorData.details.proposals > 0) {
            filteredSuggestions.push(`Elimine ou transfira as ${errorData.details.proposals} proposta(s) associada(s)`)
          }
          if (errorData.details.invoices > 0) {
            filteredSuggestions.push(`Elimine ou transfira as ${errorData.details.invoices} fatura(s) associada(s)`)
          }
          filteredSuggestions.push('Depois tente eliminar o projeto novamente')

          setDeleteError({
            show: true,
            title: errorData.error || `Não é possível eliminar ${project.name}`,
            message: errorData.message || 'Este projeto tem dados associados que impedem a sua eliminação.',
            suggestions: filteredSuggestions,
            canForceDelete: errorData.canForceDelete || false
          })
        } else {
          // Generic error
          setDeleteError({
            show: true,
            title: 'Erro ao eliminar projeto',
            message: errorData.error || 'Ocorreu um erro inesperado ao tentar eliminar o projeto.',
            suggestions: ['Tente novamente em alguns momentos', 'Verifique sua conexão com a internet']
          })
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      setDeleteError({
        show: true,
        title: 'Erro de conexão',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        suggestions: ['Verifique sua conexão com a internet', 'Tente novamente em alguns momentos']
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleForceDelete = async () => {
    if (!project) return

    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: Forçar eliminação do projeto "${project.name}"?\n\n` +
      `Esta ação irá eliminar PERMANENTEMENTE:\n` +
      `• O projeto\n` +
      `• Todas as tarefas associadas\n` +
      `• Todas as entradas de tempo\n` +
      `• Todas as propostas associadas\n` +
      `• Todas as faturas associadas\n\n` +
      `Esta ação NÃO PODE ser desfeita!`
    )

    if (!confirmed) return

    try {
      setForceDeleting(true)
      const response = await fetch(`/api/projects/${project.id}?force=true`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/dashboard/projects')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao forçar eliminação do projeto')
      }
    } catch (error) {
      console.error('Error force deleting project:', error)
      alert('Erro ao forçar eliminação do projeto')
    } finally {
      setForceDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'IN_PROGRESS':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'ON_HOLD':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'Planeamento'
      case 'IN_PROGRESS':
        return 'Em Progresso'
      case 'ON_HOLD':
        return 'Em Pausa'
      case 'COMPLETED':
        return 'Concluído'
      case 'CANCELLED':
        return 'Cancelado'
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

  if (loading) {
    return (
      <DashboardLayout title="Projeto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  if (!project) {
    return (
      <DashboardLayout title="Projeto">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            Projeto não encontrado
          </h3>
          <p className="text-slate-400 mb-6">
            O projeto que procura não existe ou foi removido.
          </p>
          <Link href="/dashboard/projects">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Projetos
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={project.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{project.name}</h1>
              <p className="text-slate-400">{project.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={`border ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </Badge>
            <Link href={`/dashboard/projects/${project.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              size="sm" 
              className="gap-2"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'A eliminar...' : 'Eliminar'}
            </Button>
          </div>
        </div>

        {/* Project Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{project.progress}%</span>
                  <span className="text-slate-400">
                    {project.completedTasksCount}/{project.tasksCount} tarefas
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-lg font-semibold text-slate-100">
                  {formatCurrency(project.budget)}
                </div>
                <div className="text-sm text-slate-400">
                  Gasto: {formatCurrency(project.actualCost)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-lg font-semibold text-slate-100">
                  {project.totalHours}h
                </div>
                <div className="text-sm text-slate-400">
                  Registadas
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Prazo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-lg font-semibold text-slate-100">
                  {project.endDate ? formatDate(project.endDate) : 'Sem prazo'}
                </div>
                <div className="text-sm text-slate-400">
                  Início: {formatDate(project.startDate)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client & Manager Info */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Equipa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Cliente</h4>
                <div className="space-y-1">
                  <div className="text-slate-100 font-medium">{project.client.name}</div>
                  {project.client.company && (
                    <div className="text-sm text-slate-400">{project.client.company}</div>
                  )}
                  <div className="text-sm text-slate-400">{project.client.email}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Gestor do Projeto</h4>
                <div className="space-y-1">
                  <div className="text-slate-100 font-medium">{project.manager.name}</div>
                  <div className="text-sm text-slate-400">{project.manager.email}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Prioridade</h4>
                <div className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Tarefas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.tasks.length > 0 ? (
                <div className="space-y-3">
                  {project.tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-100 line-clamp-1">
                          {task.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          {task.assignee ? task.assignee.name : 'Não atribuída'}
                        </div>
                      </div>
                      <Badge
                        variant={task.status === 'COMPLETED' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                  {project.tasks.length > 5 && (
                    <div className="text-xs text-slate-400 text-center pt-2">
                      +{project.tasks.length - 5} mais tarefas
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-sm text-slate-400">Nenhuma tarefa criada</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Time Entries */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Tempo Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.timeEntries.length > 0 ? (
                <div className="space-y-3">
                  {project.timeEntries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-100">
                          {entry.hours}h
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatDate(entry.date)}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-1">
                        {entry.description}
                      </div>
                      <div className="text-xs text-slate-500">
                        {entry.user.name}
                      </div>
                    </div>
                  ))}
                  {project.timeEntries.length > 5 && (
                    <div className="text-xs text-slate-400 text-center pt-2">
                      +{project.timeEntries.length - 5} mais registos
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-sm text-slate-400">Nenhum tempo registado</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Proposals */}
        {project.proposals.length > 0 && (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Propostas Associadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.proposals.map((proposal) => (
                  <div key={proposal.id} className="p-4 bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-slate-100 line-clamp-1">
                        {proposal.title}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {proposal.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-400">
                      {formatCurrency(proposal.total)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setDeleteError({ show: false, title: '', message: '', suggestions: [], canForceDelete: false })}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-100"
                  >
                    Entendi
                  </Button>
                  {deleteError.canForceDelete && (
                    <Button
                      onClick={handleForceDelete}
                      disabled={forceDeleting}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {forceDeleting ? 'A forçar eliminação...' : 'Forçar Eliminação'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
