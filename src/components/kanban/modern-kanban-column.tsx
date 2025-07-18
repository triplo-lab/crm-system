"use client"

import { useState, memo, useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MoreHorizontal, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { KanbanCard } from './modern-kanban-card'
import { SimpleColumnEditor } from './simple-column-editor'
import { MonthlyLeadsView } from './monthly-leads-view'
import { Button } from '@/components/ui/button'
import { Lead, KanbanColumn as KanbanColumnType } from '@/types/kanban'

interface KanbanColumnProps {
  column: KanbanColumnType & { leads: Lead[]; count: number }
  leads: Lead[]
  onColumnUpdate: (column: KanbanColumnType) => void
  onAddLead?: (status: string) => void
  onDuplicateLead?: (lead: Lead) => void
  onArchiveLead?: (leadId: string) => void
  onAssignLead?: (leadId: string) => void
  onCreateProposal?: (leadId: string) => void
  isDraggedOver: boolean
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  leads,
  onColumnUpdate,
  onAddLead,
  onDuplicateLead,
  onArchiveLead,
  onAssignLead,
  onCreateProposal,
  isDraggedOver
}: KanbanColumnProps) {
  const [showMonthlyView, setShowMonthlyView] = useState(false)
  const { setNodeRef, isOver } = useDroppable({
    id: column.columnId,
  })

  // Calculate column metrics - memoized for performance
  const columnMetrics = useMemo(() => {
    const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0)
    const avgProbability = leads.length > 0
      ? leads.reduce((sum, lead) => sum + (lead.probability || 0), 0) / leads.length
      : 0
    return { totalValue, avgProbability }
  }, [leads])

  return (
    <motion.div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-80 rounded-xl p-4 transition-all duration-200
        ${isOver 
          ? 'bg-slate-700/70 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20' 
          : 'bg-slate-800/50 hover:bg-slate-800/70'
        }
        ${isDraggedOver ? 'scale-[0.98]' : 'scale-100'}
      `}
      layout
      whileHover={{ scale: isDraggedOver ? 0.98 : 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 group">
        <div className="flex items-center gap-3 flex-1">
          <motion.div 
            className={`w-3 h-3 rounded-full ${column.color}`}
            whileHover={{ scale: 1.2 }}
            transition={{ duration: 0.2 }}
          />
          <h3 className="font-semibold text-slate-100 truncate">{column.title}</h3>
          <motion.span 
            className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full min-w-[24px] text-center"
            key={column.count}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {column.count}
          </motion.span>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <SimpleColumnEditor
            column={column}
            onUpdate={onColumnUpdate}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-blue-500/20"
            onClick={() => setShowMonthlyView(!showMonthlyView)}
            title="Ver leads por mês"
          >
            <Calendar className="w-3 h-3 text-blue-400" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Column Metrics */}
      {(columnMetrics.totalValue > 0 || columnMetrics.avgProbability > 0) && (
        <motion.div
          className="grid grid-cols-2 gap-2 mb-4 text-xs"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          {columnMetrics.totalValue > 0 && (
            <div className="bg-slate-700/30 rounded-lg p-2">
              <div className="text-slate-400 mb-1">Valor Total</div>
              <div className="text-slate-100 font-semibold">
                €{columnMetrics.totalValue.toLocaleString()}
              </div>
            </div>
          )}
          {columnMetrics.avgProbability > 0 && (
            <div className="bg-slate-700/30 rounded-lg p-2">
              <div className="text-slate-400 mb-1">Prob. Média</div>
              <div className="text-slate-100 font-semibold flex items-center gap-1">
                {columnMetrics.avgProbability.toFixed(0)}%
                {columnMetrics.avgProbability > 50 ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Add New Lead Button */}
      <motion.div 
        className="mb-3"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant="ghost"
          onClick={() => onAddLead?.(column.columnId)}
          className="w-full h-8 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-dashed border-slate-600 hover:border-slate-500"
        >
          <Plus className="w-3 h-3 mr-1" />
          Adicionar Lead
        </Button>
      </motion.div>

      {/* Column Content */}
      <SortableContext items={leads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
        <motion.div 
          className="space-y-3 min-h-[200px]"
          layout
        >
          <AnimatePresence mode="popLayout">
            {leads.map((lead, index) => (
              <motion.div
                key={lead.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ 
                  duration: 0.2,
                  delay: index * 0.05,
                  layout: { duration: 0.3 }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <KanbanCard
                  lead={lead}
                  columnColor={column.color}
                  onDuplicate={onDuplicateLead}
                  onArchive={onArchiveLead}
                  onAssign={onAssignLead}
                  onCreateProposal={onCreateProposal}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </SortableContext>

      {/* Empty State */}
      {leads.length === 0 && (
        <motion.div 
          className="flex flex-col items-center justify-center py-8 text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-12 h-12 bg-slate-700/30 rounded-full flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-sm text-center">
            Nenhum lead nesta etapa
          </p>
        </motion.div>
      )}

      {/* Monthly Leads View Modal */}
      <MonthlyLeadsView
        leads={leads}
        columnTitle={column.title}
        columnColor={column.color}
        isVisible={showMonthlyView}
        onClose={() => setShowMonthlyView(false)}
      />
    </motion.div>
  )
})
