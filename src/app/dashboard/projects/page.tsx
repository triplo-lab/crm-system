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
  MoreHorizontal,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Edit,
  Trash2
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
  }
  manager: {
    id: string
    name: string
  }
  team: Array<{
    id: string
    name: string
    role: string
  }>
  tasksCount: number
  completedTasksCount: number
  createdAt: string
  updatedAt: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deletingProject, setDeletingProject] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<{
    show: boolean
    title: string
    message: string
    suggestions?: string[]
    canForceDelete?: boolean
    projectId?: string
  }>({
    show: false,
    title: '',
    message: '',
    suggestions: [],
    canForceDelete: false,
    projectId: undefined
  })
  const [forceDeleting, setForceDeleting] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        // Ensure we set an array, even if the API returns something else
        setProjects(Array.isArray(data.projects) ? data.projects : Array.isArray(data) ? data : [])
      } else {
        console.error('Failed to fetch projects:', response.status)
        setProjects([])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (project: Project) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja eliminar o projeto "${project.name}"?\n\nEsta ação não pode ser desfeita.`
    )

    if (!confirmed) return

    try {
      setDeletingProject(project.id)
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove project from local state
        setProjects(prev => prev.filter(p => p.id !== project.id))
      } else {
        const errorData = await response.json()

        // Handle specific error cases
        if (response.status === 400 && errorData.details) {
          // Show detailed error with suggestions
          const suggestions = [
            'Elimine ou transfira todas as tarefas associadas',
            'Elimine ou transfira todas as entradas de tempo',
            'Elimine ou transfira todas as propostas associadas',
            'Elimine ou transfira todas as faturas associadas',
            'Depois tente eliminar o projeto novamente'
          ]

          // Filter suggestions based on what actually exists
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
            canForceDelete: errorData.canForceDelete || false,
            projectId: project.id
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
      setDeletingProject(null)
    }
  }

  const handleForceDelete = async () => {
    if (!deleteError.projectId) return

    const project = projects.find(p => p.id === deleteError.projectId)
    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: Forçar eliminação do projeto "${project?.name}"?\n\n` +
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
      const response = await fetch(`/api/projects/${deleteError.projectId}?force=true`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove project from local state
        setProjects(prev => prev.filter(p => p.id !== deleteError.projectId))
        setDeleteError({ show: false, title: '', message: '', suggestions: [], canForceDelete: false, projectId: undefined })
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

  const filteredProjects = Array.isArray(projects) ? projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  }) : []

  if (loading) {
    return (
      <DashboardLayout title="Projetos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Projetos">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Pesquisar projetos..."
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
              <option value="PLANNING">Planeamento</option>
              <option value="IN_PROGRESS">Em Progresso</option>
              <option value="ON_HOLD">Em Pausa</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          <Link href="/dashboard/projects/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          </Link>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} variant="elevated" hover>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client and Manager */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{project.client.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">Gestor: {project.manager.name}</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Progresso</span>
                    <span className="text-slate-300">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-400">
                      {project.completedTasksCount}/{project.tasksCount} tarefas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">
                      {formatDate(project.endDate || project.startDate)}
                    </span>
                  </div>
                </div>

                {/* Budget */}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Orçamento</span>
                  <span className="text-slate-300">{formatCurrency(project.budget)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="w-4 h-4" />
                      Ver
                    </Button>
                  </Link>
                  <Link href={`/dashboard/projects/${project.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProject(project)}
                    disabled={deletingProject === project.id}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    {deletingProject === project.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              {searchTerm || statusFilter !== "all" ? "Nenhum projeto encontrado" : "Nenhum projeto criado"}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || statusFilter !== "all" 
                ? "Tente ajustar os filtros de pesquisa" 
                : "Comece criando o seu primeiro projeto"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Link href="/dashboard/projects/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Projeto
                </Button>
              </Link>
            )}
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

                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setDeleteError({ show: false, title: '', message: '', suggestions: [], canForceDelete: false, projectId: undefined })}
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
