'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Textarea } from '@/components/ui/textarea'
import { Select, SelectOption } from '@/components/ui/select'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProposalItem {
  id?: string
  title: string
  description?: string
  quantity: number
  unitPrice: number
  total: number
}

interface Client {
  id: string
  name: string
  email: string
}

interface Lead {
  id: string
  name: string
  email: string
  company?: string
  clientId?: string
}

interface Proposal {
  id: string
  title: string
  description?: string
  content: string
  status: string
  validUntil?: string
  totalAmount: number
  clientId: string
  client: Client
  items: ProposalItem[]
}

export default function EditProposalPage() {
  const params = useParams()
  const router = useRouter()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    status: 'DRAFT',
    validUntil: '',
    clientId: '',
    leadId: '',
    items: [] as ProposalItem[]
  })

  useEffect(() => {
    fetchProposal()
    fetchClients()
    fetchLeads()
  }, [params.id])

  // Filter leads when client changes
  useEffect(() => {
    if (formData.clientId) {
      // Filter leads that belong to the selected client
      const clientLeads = leads.filter(lead => lead.clientId === formData.clientId)
      setFilteredLeads(clientLeads)
    } else {
      // Show all leads if no client is selected
      setFilteredLeads(leads)
    }
  }, [formData.clientId, leads])

  const fetchProposal = async () => {
    try {
      const response = await fetch(`/api/proposals/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProposal(data)
        setFormData({
          title: data.title,
          description: data.description || '',
          content: data.content || '',
          status: data.status,
          validUntil: data.validUntil ? data.validUntil.split('T')[0] : '',
          clientId: data.clientId || '',
          leadId: data.leadId || '',
          items: Array.isArray(data.items) ? data.items : []
        })
      }
    } catch (error) {
      console.error('Error fetching proposal:', error)
      toast.error('Erro ao carregar proposta')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        // A API retorna { clients: [...], pagination: {...} }
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([]) // Garantir que seja sempre um array
    }
  }

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      setLeads([])
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        title: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }]
    }))
  }

  const updateItem = (index: number, field: keyof ProposalItem, value: string | number) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = {
        ...newItems[index],
        [field]: value
      }
      
      // Recalculate total for this item
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
      }
      
      return {
        ...prev,
        items: newItems
      }
    })
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('O título é obrigatório')
      return
    }

    if (!formData.clientId && !formData.leadId) {
      toast.error('Selecione um cliente ou lead')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/proposals/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
          totalAmount: calculateTotal()
        }),
      })

      if (response.ok) {
        toast.success('Proposta atualizada com sucesso!')
        router.push(`/dashboard/proposals/${params.id}`)
      } else {
        throw new Error('Erro ao atualizar proposta')
      }
    } catch (error) {
      console.error('Error updating proposal:', error)
      toast.error('Erro ao atualizar proposta')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposta não encontrada</h2>
          <Button onClick={() => router.push('/dashboard/proposals')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às Propostas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/proposals/${params.id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Proposta</h1>
            <p className="text-gray-600">{proposal.title}</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'A guardar...' : 'Guardar'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Título da proposta"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrição breve da proposta"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Conteúdo Detalhado</label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Conteúdo detalhado da proposta"
                  rows={6}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Itens da Proposta</CardTitle>
                <Button onClick={addItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateItem(index, 'title', e.target.value)}
                        placeholder="Nome do item"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preço Unitário (€)</label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total (€)</label>
                      <Input
                        value={`€${item.total.toFixed(2)}`}
                        disabled
                        className="bg-gray-50 text-right"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Descrição do item"
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    />
                  </div>
                </div>
              ))}

              {formData.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum item adicionado</p>
                  <Button onClick={addItem} className="mt-2">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Item
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => handleInputChange('clientId', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecionar cliente</option>
                  {Array.isArray(clients) && clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="lead" className="block text-sm font-medium text-gray-700 mb-1">
                  Lead {formData.clientId && <span className="text-xs text-gray-500">(filtrado por cliente)</span>}
                </label>
                <select
                  value={formData.leadId}
                  onChange={(e) => handleInputChange('leadId', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecionar lead</option>
                  {Array.isArray(filteredLeads) && filteredLeads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} {lead.company && `(${lead.company})`}
                    </option>
                  ))}
                  {formData.clientId && filteredLeads.length === 0 && (
                    <option disabled>Nenhum lead encontrado para este cliente</option>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="DRAFT">Rascunho</option>
                  <option value="SENT">Enviada</option>
                  <option value="ACCEPTED">Aceite</option>
                  <option value="REJECTED">Rejeitada</option>
                  <option value="EXPIRED">Expirada</option>
                </select>
              </div>

              <div>
                <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-1">Válida até</label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => handleInputChange('validUntil', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Itens:</span>
                  <span>{formData.items.length}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>€{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-blue-600 hover:bg-blue-700 min-w-[140px]"
        >
          <Save className="w-4 h-4" />
          {saving ? 'A guardar...' : 'Guardar Alterações'}
        </Button>
      </div>
    </div>
  )
}
