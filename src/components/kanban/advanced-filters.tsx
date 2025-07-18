"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Filter,
  X,
  Calendar,
  DollarSign,
  User,
  Tag,
  TrendingUp,
  Search,
  Save,
  RotateCcw,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KanbanFilter } from '@/types/kanban'

interface AdvancedFiltersProps {
  filters: KanbanFilter
  onFiltersChange: (filters: KanbanFilter) => void
  onSaveView?: (name: string, filters: KanbanFilter) => void
  availableUsers?: string[]
  availableSources?: string[]
  availableTags?: string[]
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onSaveView,
  availableUsers = [],
  availableSources = [],
  availableTags = []
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Count active filters
  useEffect(() => {
    const active: string[] = []
    if (filters.assignedTo?.length) active.push(`${filters.assignedTo.length} responsável(eis)`)
    if (filters.source?.length) active.push(`${filters.source.length} fonte(s)`)
    if (filters.priority?.length) active.push(`${filters.priority.length} prioridade(s)`)
    if (filters.valueRange) active.push('valor')
    if (filters.probabilityRange) active.push('probabilidade')
    if (filters.dateRange) active.push('data')
    if (filters.tags?.length) active.push(`${filters.tags.length} tag(s)`)
    
    setActiveFilters(active)
  }, [filters])

  const updateFilter = (key: keyof KanbanFilter, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const toggleArrayFilter = (key: 'assignedTo' | 'source' | 'priority' | 'tags', value: string) => {
    const current = filters[key] || []
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value]
    
    updateFilter(key, updated.length > 0 ? updated : undefined)
  }

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`gap-2 ${activeFilters.length > 0 ? 'border-blue-500 bg-blue-500/10' : ''}`}
      >
        <Filter className="w-4 h-4" />
        Filtros
        {activeFilters.length > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {activeFilters.length}
          </Badge>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {filter}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs text-slate-400 hover:text-slate-200"
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        </div>
      )}

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 z-50 mt-2 w-96 max-w-[90vw]"
          >
            <Card className="bg-slate-800/95 backdrop-blur-sm border-slate-700 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Filtros Avançados</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-6 px-2 text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Limpar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-2 block">
                    Pesquisa Rápida
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Nome, email, empresa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Assigned To */}
                {availableUsers.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-2 block flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Responsável
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {availableUsers.map(user => (
                        <Button
                          key={user}
                          variant={filters.assignedTo?.includes(user) ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => toggleArrayFilter('assignedTo', user)}
                          className="h-6 px-2 text-xs"
                        >
                          {user}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority */}
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-2 block flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Prioridade
                  </label>
                  <div className="flex gap-1">
                    {['HIGH', 'MEDIUM', 'LOW'].map(priority => (
                      <Button
                        key={priority}
                        variant={filters.priority?.includes(priority) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleArrayFilter('priority', priority)}
                        className="h-6 px-2 text-xs"
                      >
                        {priority === 'HIGH' ? 'Alta' : priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Value Range */}
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-2 block flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Valor (€)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Mín"
                      value={filters.valueRange?.min || ''}
                      onChange={(e) => updateFilter('valueRange', {
                        ...filters.valueRange,
                        min: parseFloat(e.target.value) || 0
                      })}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Máx"
                      value={filters.valueRange?.max || ''}
                      onChange={(e) => updateFilter('valueRange', {
                        ...filters.valueRange,
                        max: parseFloat(e.target.value) || 999999
                      })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Probability Range */}
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-2 block">
                    Probabilidade (%)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Mín"
                      min="0"
                      max="100"
                      value={filters.probabilityRange?.min || ''}
                      onChange={(e) => updateFilter('probabilityRange', {
                        ...filters.probabilityRange,
                        min: parseInt(e.target.value) || 0
                      })}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Máx"
                      min="0"
                      max="100"
                      value={filters.probabilityRange?.max || ''}
                      onChange={(e) => updateFilter('probabilityRange', {
                        ...filters.probabilityRange,
                        max: parseInt(e.target.value) || 100
                      })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Sources */}
                {availableSources.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-2 block">
                      Fonte
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {availableSources.map(source => (
                        <Button
                          key={source}
                          variant={filters.source?.includes(source) ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => toggleArrayFilter('source', source)}
                          className="h-6 px-2 text-xs"
                        >
                          {source}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save View */}
                {onSaveView && (
                  <div className="pt-2 border-t border-slate-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const name = prompt('Nome da vista:')
                        if (name) onSaveView(name, filters)
                      }}
                      className="w-full h-8 text-xs"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Guardar Vista
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
