'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Activity, 
  User, 
  FileText, 
  FolderOpen, 
  DollarSign, 
  CheckCircle,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Send,
  UserCheck,
  ArrowRight,
  LogIn,
  LogOut,
  Download,
  Upload,
  Database,
  RefreshCw
} from 'lucide-react'

interface SystemActivity {
  id: string
  action: string
  entityType: string
  entityId: string
  entityName?: string
  description: string
  metadata?: any
  userName: string
  user?: {
    id: string
    name: string
    avatar?: string
  }
  ipAddress?: string
  userAgent?: string
  createdAt: string
  timeAgo: string
}

interface SystemActivitiesProps {
  entityType?: string
  entityId?: string
  userId?: string
  limit?: number
  showHeader?: boolean
  className?: string
}

export function SystemActivities({
  entityType,
  entityId,
  userId,
  limit = 20,
  showHeader = true,
  className = ''
}: SystemActivitiesProps) {
  const [activities, setActivities] = useState<SystemActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActivities()
  }, [entityType, entityId, userId, limit])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (limit) params.append('limit', limit.toString())
      if (entityType) params.append('entityType', entityType)
      if (entityId) params.append('entityId', entityId)
      if (userId) params.append('userId', userId)

      const response = await fetch(`/api/system-activities?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }

      const data = await response.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
      setError('Erro ao carregar atividades')
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <UserPlus className="w-4 h-4" />
      case 'UPDATE': return <Edit className="w-4 h-4" />
      case 'DELETE': return <Trash2 className="w-4 h-4" />
      case 'VIEW': return <Eye className="w-4 h-4" />
      case 'APPROVE': return <ThumbsUp className="w-4 h-4" />
      case 'REJECT': return <ThumbsDown className="w-4 h-4" />
      case 'SEND': return <Send className="w-4 h-4" />
      case 'COMPLETE': return <CheckCircle className="w-4 h-4" />
      case 'ASSIGN': return <UserCheck className="w-4 h-4" />
      case 'MOVE': return <ArrowRight className="w-4 h-4" />
      case 'LOGIN': return <LogIn className="w-4 h-4" />
      case 'LOGOUT': return <LogOut className="w-4 h-4" />
      case 'EXPORT': return <Download className="w-4 h-4" />
      case 'IMPORT': return <Upload className="w-4 h-4" />
      case 'BACKUP': return <Database className="w-4 h-4" />
      case 'RESTORE': return <RefreshCw className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'lead': return <User className="w-4 h-4" />
      case 'client': return <User className="w-4 h-4" />
      case 'project': return <FolderOpen className="w-4 h-4" />
      case 'proposal': return <FileText className="w-4 h-4" />
      case 'task': return <CheckCircle className="w-4 h-4" />
      case 'invoice': return <DollarSign className="w-4 h-4" />
      case 'ticket': return <FileText className="w-4 h-4" />
      case 'user': return <User className="w-4 h-4" />
      case 'article': return <FileText className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'UPDATE': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'DELETE': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'VIEW': return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      case 'APPROVE': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'REJECT': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'SEND': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'COMPLETE': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'ASSIGN': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'MOVE': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'LOGIN': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'LOGOUT': return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      case 'EXPORT': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      case 'IMPORT': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      case 'BACKUP': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      case 'RESTORE': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Atividades do Sistema
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 p-3 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Atividades do Sistema
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-400">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchActivities}
              className="mt-4"
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Atividades do Sistema
            </CardTitle>
            <p className="text-sm text-slate-400 mt-1">
              Histórico de ações no sistema
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchActivities}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhuma atividade encontrada</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start space-x-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.user?.avatar} />
                    <AvatarFallback className="text-xs">
                      {activity.user?.name?.charAt(0)?.toUpperCase() || activity.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`p-1.5 rounded-lg ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-200">
                      {activity.user?.name || activity.userName || 'Utilizador Desconhecido'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {activity.action}
                    </Badge>
                    {activity.entityType && (
                      <div className="flex items-center gap-1 text-slate-400">
                        {getEntityIcon(activity.entityType)}
                        <span className="text-xs">{activity.entityType}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-300 mb-2">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {activity.timeAgo}
                    </span>
                    {activity.ipAddress && (
                      <span className="text-xs text-slate-600">
                        {activity.ipAddress}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
