'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Search,
  RotateCcw,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Mail,
  Phone,
  Building
} from 'lucide-react'

interface TrashedLead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: string
  priority: string
  value?: number
  deletedAt: string
  deletedBy?: string
  createdAt: string
  assignee?: {
    id: string
    name: string
    email: string
  }
  deletedByUser?: {
    id: string
    name: string
    email: string
  }
}

export default function LeadsTrashPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<TrashedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [restoring, setRestoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchTrashedLeads()
  }, [searchTerm])

  const fetchTrashedLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/leads/trash?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Error fetching trashed leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (leadId: string) => {
    setRestoring(leadId)
    try {
      const response = await fetch(`/api/leads/${leadId}/trash`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLeads(prev => prev.filter(lead => lead.id !== leadId))
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao restaurar lead')
      }
    } catch (error) {
      console.error('Error restoring lead:', error)
      alert('Erro ao restaurar lead')
    } finally {
      setRestoring(null)
    }
  }

  const handlePermanentDelete = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja eliminar permanentemente este lead? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeleting(leadId)
    try {
      const response = await fetch(`/api/leads/trash?id=${leadId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLeads(prev => prev.filter(lead => lead.id !== leadId))
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao eliminar lead permanentemente')
      }
    } catch (error) {
      console.error('Error permanently deleting lead:', error)
      alert('Erro ao eliminar lead permanentemente')
    } finally {
      setDeleting(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'CONTACTED':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'QUALIFIED':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'PROPOSAL':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'NEGOTIATION':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'CLOSED_WON':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'CLOSED_LOST':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'Novo'
      case 'CONTACTED':
        return 'Contactado'
      case 'QUALIFIED':
        return 'Qualificado'
      case 'PROPOSAL':
        return 'Proposta'
      case 'NEGOTIATION':
        return 'Negociação'
      case 'CLOSED_WON':
        return 'Fechado - Ganho'
      case 'CLOSED_LOST':
        return 'Fechado - Perdido'
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/leads">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Leads
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Lixeira de Leads</h1>
            <p className="text-slate-400">Leads eliminados temporariamente</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Pesquisar leads na lixeira..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-slate-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>A carregar leads da lixeira...</span>
          </div>
        </div>
      ) : leads.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <Trash2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Lixeira vazia
            </h3>
            <p className="text-slate-400">
              Não há leads na lixeira no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <Card key={lead.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-slate-100 text-lg mb-1">
                      {lead.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Mail className="w-3 h-3" />
                      {lead.email}
                    </div>
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </div>
                    )}
                    {lead.company && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Building className="w-3 h-3" />
                        {lead.company}
                      </div>
                    )}
                  </div>
                  <Badge className={getStatusColor(lead.status)}>
                    {getStatusText(lead.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Deleted Info */}
                  <div className="text-xs text-slate-400 bg-slate-700/30 rounded p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3" />
                      Eliminado em: {new Date(lead.deletedAt).toLocaleDateString('pt-PT')}
                    </div>
                    {lead.deletedByUser && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Por: {lead.deletedByUser.name}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(lead.id)}
                      disabled={restoring === lead.id || deleting === lead.id}
                      className="flex-1"
                    >
                      {restoring === lead.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          A restaurar...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Restaurar
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handlePermanentDelete(lead.id)}
                      disabled={restoring === lead.id || deleting === lead.id}
                    >
                      {deleting === lead.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
