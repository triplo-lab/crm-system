"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { memo, useMemo, useState } from 'react'
import {
  Mail,
  Phone,
  Calendar,
  Edit,
  MoreVertical,
  Building2,
  TrendingUp,
  Clock,
  User,
  Star,
  Trash2,
  Copy,
  Archive,
  UserPlus,
  FileText,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Lead } from '@/types/kanban'
import { formatDate, formatCurrency } from '@/lib/utils'

interface KanbanCardProps {
  lead: Lead
  columnColor?: string
  isDragging?: boolean
  onDuplicate?: (lead: Lead) => void
  onArchive?: (leadId: string) => void
  onAssign?: (leadId: string) => void
  onCreateProposal?: (leadId: string) => void
}

export const KanbanCard = memo(function KanbanCard({
  lead,
  columnColor,
  isDragging = false,
  onDuplicate,
  onArchive,
  onAssign,
  onCreateProposal
}: KanbanCardProps) {
  const [movingToTrash, setMovingToTrash] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleMoveToTrash = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Tem certeza que deseja mover "${lead.name}" para a lixeira?`)) {
      return
    }

    setMovingToTrash(true)
    try {
      const response = await fetch(`/api/leads/${lead.id}/trash`, {
        method: 'POST',
      })

      if (response.ok) {
        // Refresh the page to update the kanban board
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao mover lead para a lixeira')
      }
    } catch (error) {
      console.error('Error moving lead to trash:', error)
      alert('Erro ao mover lead para a lixeira')
    } finally {
      setMovingToTrash(false)
    }
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDuplicate?.(lead)
  }

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onArchive?.(lead.id)
  }

  const handleAssign = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAssign?.(lead.id)
  }

  const handleCreateProposal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCreateProposal?.(lead.id)
  }

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(lead.email)
      // Could show a toast notification here
    } catch (error) {
      console.error('Failed to copy email:', error)
    }
  }

  const handleCopyPhone = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (lead.phone) {
      try {
        await navigator.clipboard.writeText(lead.phone)
        // Could show a toast notification here
      } catch (error) {
        console.error('Failed to copy phone:', error)
      }
    }
  }

  // Priority indicator based on value and probability - memoized for performance
  const priority = useMemo(() => {
    const value = lead.value || 0
    const probability = lead.probability || 0
    const score = value * (probability / 100)

    if (score > 10000) return { level: 'high', color: 'bg-red-500', label: 'Alta' }
    if (score > 5000) return { level: 'medium', color: 'bg-yellow-500', label: 'Média' }
    return { level: 'low', color: 'bg-green-500', label: 'Baixa' }
  }, [lead.value, lead.probability])

  // Days since created - memoized for performance
  const daysSinceCreated = useMemo(() =>
    Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    [lead.createdAt]
  )

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        ${isDragging || isSortableDragging ? 'opacity-50 rotate-2 scale-105' : 'opacity-100'}
        cursor-grab active:cursor-grabbing
      `}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-200 bg-slate-900/80 border-slate-700/50 hover:border-slate-600/70 overflow-hidden">
        {/* Column Color Indicator */}
        <div className={`h-1 ${columnColor || 'bg-slate-500'}`} />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/dashboard/leads/${lead.id}`}
              onClick={(e) => e.stopPropagation()}
              className="space-y-1 flex-1 min-w-0 block"
            >
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold line-clamp-1 group-hover:text-blue-400 transition-colors">
                  {lead.name}
                </CardTitle>
                {lead.value && lead.value > 10000 && (
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                {lead.company && (
                  <div className="flex items-center gap-1 text-slate-400">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{lead.company}</span>
                  </div>
                )}
                {daysSinceCreated > 7 && (
                  <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                    {daysSinceCreated}d
                  </Badge>
                )}
              </div>
            </Link>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link href={`/dashboard/leads/${lead.id}/edit`} onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Edit className="w-3 h-3" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:text-red-400 hover:bg-red-500/10"
                onClick={handleMoveToTrash}
                disabled={movingToTrash}
                title="Mover para lixeira"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-slate-600/50">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
                  <DropdownMenuItem onClick={handleCopyEmail} className="gap-2 text-slate-200 hover:bg-slate-700">
                    <Copy className="w-4 h-4" />
                    Copiar Email
                  </DropdownMenuItem>
                  {lead.phone && (
                    <DropdownMenuItem onClick={handleCopyPhone} className="gap-2 text-slate-200 hover:bg-slate-700">
                      <Copy className="w-4 h-4" />
                      Copiar Telefone
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem onClick={handleDuplicate} className="gap-2 text-slate-200 hover:bg-slate-700">
                    <Copy className="w-4 h-4" />
                    Duplicar Lead
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAssign} className="gap-2 text-slate-200 hover:bg-slate-700">
                    <UserPlus className="w-4 h-4" />
                    Atribuir a...
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCreateProposal} className="gap-2 text-slate-200 hover:bg-slate-700">
                    <FileText className="w-4 h-4" />
                    Criar Proposta
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.open(`/dashboard/leads/${lead.id}`, '_blank')
                    }}
                    className="gap-2 text-slate-200 hover:bg-slate-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir em Nova Aba
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchive} className="gap-2 text-slate-200 hover:bg-slate-700">
                    <Archive className="w-4 h-4" />
                    Arquivar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <Link
          href={`/dashboard/leads/${lead.id}`}
          onClick={(e) => e.stopPropagation()}
          className="block"
        >
          <CardContent className="space-y-3 pt-0">
            {/* Contact Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-slate-300 truncate">{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-slate-300">{lead.phone}</span>
                </div>
              )}
            </div>

            {/* Key Metrics */}
            {(lead.value || lead.probability) && (
              <div className="grid grid-cols-2 gap-2">
                {lead.value && (
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-slate-400 text-xs mb-0.5">Valor</div>
                    <div className="text-slate-100 font-semibold text-xs">
                      {formatCurrency(lead.value)}
                    </div>
                  </div>
                )}
                {lead.probability && (
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-slate-400 text-xs mb-0.5">Probabilidade</div>
                    <div className="text-slate-100 font-semibold text-xs flex items-center gap-1">
                      {lead.probability}%
                      <div className={`w-2 h-2 rounded-full ${
                        lead.probability > 70 ? 'bg-green-400' :
                        lead.probability > 40 ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Expected Close Date */}
            {lead.expectedCloseDate && (
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-slate-300">
                  Fecho esperado: {formatDate(lead.expectedCloseDate)}
                </span>
              </div>
            )}

            {/* Assigned User */}
            {(lead.assignee || lead.assignedTo) && (
              <div className="flex items-center gap-2 text-xs">
                <UserAvatar
                  user={lead.assignee || {
                    id: lead.assignedTo || '',
                    name: lead.assignedTo || '',
                    email: ''
                  }}
                  size="xs"
                  showName={true}
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-700/50">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(lead.createdAt)}</span>
              </div>
              {lead.source && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 bg-slate-700/50">
                  {lead.source}
                </Badge>
              )}
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  )
})
