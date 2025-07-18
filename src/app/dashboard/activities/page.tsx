'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectOption } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { SystemActivities } from '@/components/system-activities'
import { ArrowLeft, Search, Filter, Download, RefreshCw } from 'lucide-react'

export default function ActivitiesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [limit, setLimit] = useState(50)

  const entityTypes = [
    { value: '', label: 'Todos os tipos' },
    { value: 'lead', label: 'Leads' },
    { value: 'client', label: 'Clientes' },
    { value: 'project', label: 'Projetos' },
    { value: 'proposal', label: 'Propostas' },
    { value: 'task', label: 'Tarefas' },
    { value: 'invoice', label: 'Faturas' },
    { value: 'ticket', label: 'Tickets' },
    { value: 'user', label: 'Utilizadores' },
    { value: 'article', label: 'Artigos' }
  ]

  const actions = [
    { value: '', label: 'Todas as ações' },
    { value: 'CREATE', label: 'Criar' },
    { value: 'UPDATE', label: 'Atualizar' },
    { value: 'DELETE', label: 'Eliminar' },
    { value: 'VIEW', label: 'Visualizar' },
    { value: 'APPROVE', label: 'Aprovar' },
    { value: 'REJECT', label: 'Rejeitar' },
    { value: 'SEND', label: 'Enviar' },
    { value: 'COMPLETE', label: 'Completar' },
    { value: 'ASSIGN', label: 'Atribuir' },
    { value: 'MOVE', label: 'Mover' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'EXPORT', label: 'Exportar' },
    { value: 'IMPORT', label: 'Importar' },
    { value: 'BACKUP', label: 'Backup' },
    { value: 'RESTORE', label: 'Restaurar' }
  ]

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      params.append('limit', '1000') // Export more records
      if (entityTypeFilter) params.append('entityType', entityTypeFilter)
      
      const response = await fetch(`/api/system-activities?${params}`)
      if (response.ok) {
        const data = await response.json()
        
        // Convert to CSV
        const csvContent = [
          ['Data/Hora', 'Utilizador', 'Ação', 'Tipo', 'Entidade', 'Descrição', 'IP'].join(','),
          ...data.activities.map((activity: any) => [
            new Date(activity.createdAt).toLocaleString('pt-PT'),
            activity.user.name,
            activity.action,
            activity.entityType,
            activity.entityName || '',
            `"${activity.description.replace(/"/g, '""')}"`,
            activity.ipAddress || ''
          ].join(','))
        ].join('\n')

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `atividades-sistema-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error exporting activities:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-200">Atividades do Sistema</h1>
            <p className="text-slate-300">Histórico completo de ações no sistema</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Pesquisar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Pesquisar atividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-slate-200 bg-slate-800 border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Tipo de Entidade
              </label>
              <Select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="text-slate-200 bg-slate-800 border-slate-600"
              >
                <SelectOption value="">Selecionar tipo</SelectOption>
                {entityTypes.map((type) => (
                  <SelectOption key={type.value} value={type.value}>
                    {type.label}
                  </SelectOption>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Ação
              </label>
              <Select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="text-slate-200 bg-slate-800 border-slate-600"
              >
                <SelectOption value="">Selecionar ação</SelectOption>
                {actions.map((action) => (
                  <SelectOption key={action.value} value={action.value}>
                    {action.label}
                  </SelectOption>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Limite de Registos
              </label>
              <Select
                value={limit.toString()}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="text-slate-200 bg-slate-800 border-slate-600"
              >
                <SelectOption value="25">25 registos</SelectOption>
                <SelectOption value="50">50 registos</SelectOption>
                <SelectOption value="100">100 registos</SelectOption>
                <SelectOption value="200">200 registos</SelectOption>
                <SelectOption value="500">500 registos</SelectOption>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {(entityTypeFilter || actionFilter || searchTerm) && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-slate-400">Filtros ativos:</span>
              {entityTypeFilter && (
                <Badge variant="secondary" className="gap-1">
                  Tipo: {entityTypes.find(t => t.value === entityTypeFilter)?.label}
                  <button
                    onClick={() => setEntityTypeFilter('')}
                    className="ml-1 hover:bg-slate-600 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {actionFilter && (
                <Badge variant="secondary" className="gap-1">
                  Ação: {actions.find(a => a.value === actionFilter)?.label}
                  <button
                    onClick={() => setActionFilter('')}
                    className="ml-1 hover:bg-slate-600 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Pesquisa: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:bg-slate-600 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEntityTypeFilter('')
                  setActionFilter('')
                  setSearchTerm('')
                }}
              >
                Limpar todos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activities List */}
      <SystemActivities
        entityType={entityTypeFilter || undefined}
        limit={limit}
        showHeader={false}
        key={`${entityTypeFilter}-${actionFilter}-${limit}`}
      />
    </div>
  )
}
