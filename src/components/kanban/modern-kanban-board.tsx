"use client"

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { motion, AnimatePresence } from 'framer-motion'
import { KanbanColumn } from './modern-kanban-column'
import { KanbanCard } from './modern-kanban-card'
import { ModernLoading } from '@/components/ui/modern-loading'
import { Lead, KanbanColumn as KanbanColumnType } from '@/types/kanban'

interface ModernKanbanBoardProps {
  leads: Lead[]
  columns: KanbanColumnType[]
  onLeadMove: (leadId: string, newStatus: string, newPosition?: number) => Promise<void>
  onColumnUpdate: (column: KanbanColumnType) => void
  onAddLead?: (status: string) => void
  onDuplicateLead?: (lead: Lead) => void
  onArchiveLead?: (leadId: string) => void
  onAssignLead?: (leadId: string) => void
  onCreateProposal?: (leadId: string) => void
  searchTerm: string
  loading?: boolean
}

export function ModernKanbanBoard({
  leads,
  columns,
  onLeadMove,
  onColumnUpdate,
  onAddLead,
  onDuplicateLead,
  onArchiveLead,
  onAssignLead,
  onCreateProposal,
  searchTerm,
  loading = false
}: ModernKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Filter leads by search term
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  // Group leads by status for Kanban
  const groupedLeads = columns.map(column => ({
    ...column,
    leads: filteredLeads.filter(lead => lead.status === column.columnId),
    count: filteredLeads.filter(lead => lead.status === column.columnId).length
  }))

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    const lead = leads.find(l => l.id === active.id)
    if (lead) {
      setDraggedLead(lead)
    }
  }, [leads])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Handle drag over logic for visual feedback
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !draggedLead) {
      setActiveId(null)
      setDraggedLead(null)
      return
    }

    const overId = over.id as string
    const activeId = active.id as string

    // Check if dropping on a column
    const targetColumn = columns.find(col => col.columnId === overId)
    if (targetColumn && draggedLead.status !== targetColumn.columnId) {
      await onLeadMove(activeId, targetColumn.columnId)
    }

    setActiveId(null)
    setDraggedLead(null)
  }, [draggedLead, columns, onLeadMove])

  // Custom collision detection for better drop zones
  const collisionDetection: CollisionDetection = useCallback((args) => {
    return closestCorners(args)
  }, [])

  if (loading) {
    return <ModernLoading type="skeleton" text="Carregando pipeline..." />
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        <SortableContext items={columns.map(col => col.columnId)} strategy={horizontalListSortingStrategy}>
          <AnimatePresence>
            {groupedLeads.map((column) => (
              <motion.div
                key={column.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <KanbanColumn
                  column={column}
                  leads={column.leads}
                  onColumnUpdate={onColumnUpdate}
                  onAddLead={onAddLead}
                  onDuplicateLead={onDuplicateLead}
                  onArchiveLead={onArchiveLead}
                  onAssignLead={onAssignLead}
                  onCreateProposal={onCreateProposal}
                  isDraggedOver={activeId !== null}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
      </div>

      <DragOverlay>
        {activeId && draggedLead ? (
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 1.05, rotate: 2 }}
            transition={{ duration: 0.2 }}
            className="opacity-90"
          >
            <KanbanCard lead={draggedLead} isDragging />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
