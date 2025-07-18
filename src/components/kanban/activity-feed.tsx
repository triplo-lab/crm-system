"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  MessageCircle,
  ArrowRight,
  User,
  Calendar,
  Edit,
  Plus,
  X,
  Send
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { KanbanActivity, KanbanComment } from '@/types/kanban'
import { formatDate } from '@/lib/utils'

interface ActivityFeedProps {
  leadId?: string
  activities: KanbanActivity[]
  comments: KanbanComment[]
  onAddComment?: (content: string) => void
  isVisible?: boolean
  onToggle?: () => void
}

export function ActivityFeed({
  leadId,
  activities,
  comments,
  onAddComment,
  isVisible = false,
  onToggle
}: ActivityFeedProps) {
  const [newComment, setNewComment] = useState('')
  const [isAddingComment, setIsAddingComment] = useState(false)

  // Combine and sort activities and comments by date
  const timeline = [
    ...activities.map(activity => ({ ...activity, type: 'activity' as const })),
    ...comments.map(comment => ({ ...comment, type: 'comment' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleAddComment = async () => {
    if (!newComment.trim() || !onAddComment) return

    setIsAddingComment(true)
    try {
      await onAddComment(newComment.trim())
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsAddingComment(false)
    }
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="w-3 h-3 text-green-400" />
      case 'moved':
        return <ArrowRight className="w-3 h-3 text-blue-400" />
      case 'updated':
        return <Edit className="w-3 h-3 text-yellow-400" />
      case 'commented':
        return <MessageCircle className="w-3 h-3 text-purple-400" />
      case 'assigned':
        return <User className="w-3 h-3 text-orange-400" />
      default:
        return <Activity className="w-3 h-3 text-slate-400" />
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'border-green-500/20 bg-green-500/10'
      case 'moved':
        return 'border-blue-500/20 bg-blue-500/10'
      case 'updated':
        return 'border-yellow-500/20 bg-yellow-500/10'
      case 'commented':
        return 'border-purple-500/20 bg-purple-500/10'
      case 'assigned':
        return 'border-orange-500/20 bg-orange-500/10'
      default:
        return 'border-slate-500/20 bg-slate-500/10'
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Atividades e Comentários
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-300">
                Timeline de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {timeline.map((item, index) => (
                    <motion.div
                      key={`${item.type}-${item.id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative pl-8 pb-4 ${
                        index < timeline.length - 1 ? 'border-l-2 border-slate-700/50' : ''
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        item.type === 'activity' 
                          ? getActivityColor((item as KanbanActivity).action)
                          : 'border-purple-500/20 bg-purple-500/10'
                      }`}>
                        {item.type === 'activity' 
                          ? getActivityIcon((item as KanbanActivity).action)
                          : <MessageCircle className="w-3 h-3 text-purple-400" />
                        }
                      </div>

                      {/* Content */}
                      <div className="ml-4">
                        {item.type === 'activity' ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-200">
                                {(item as KanbanActivity).userId}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {(item as KanbanActivity).action}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-300 mb-1">
                              {(item as KanbanActivity).description}
                            </p>
                            {(item as KanbanActivity).fromStatus && (item as KanbanActivity).toStatus && (
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span>{(item as KanbanActivity).fromStatus}</span>
                                <ArrowRight className="w-3 h-3" />
                                <span>{(item as KanbanActivity).toStatus}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="text-xs bg-slate-700 text-slate-300">
                                  {(item as KanbanComment).userId.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-slate-200">
                                {(item as KanbanComment).userId}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300 bg-slate-700/30 rounded-lg p-2">
                              {(item as KanbanComment).content}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {timeline.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma atividade ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Comment */}
        <div>
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-purple-400" />
                Adicionar Comentário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="w-full h-24 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isAddingComment}
                  className="w-full gap-2"
                >
                  {isAddingComment ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Activity className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isAddingComment ? 'Enviando...' : 'Enviar Comentário'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-slate-800/50 border-slate-700/50 mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-300">
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total de atividades:</span>
                  <span className="text-slate-100 font-medium">{activities.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Comentários:</span>
                  <span className="text-slate-100 font-medium">{comments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Última atividade:</span>
                  <span className="text-slate-100 font-medium">
                    {timeline.length > 0 ? formatDate(timeline[0].createdAt) : 'Nenhuma'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
