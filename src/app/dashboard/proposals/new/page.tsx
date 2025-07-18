"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Plus, Trash2, Loader2, FileText, User, Building } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  name: string
}

interface Lead {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
}

interface User {
  id: string
  name: string
}

interface ProposalItem {
  title: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export default function NewProposalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    clientId: "",
    leadId: "",
    projectId: "",
    validUntil: "",
    currency: "EUR",
    createdBy: ""
  })

  const [items, setItems] = useState<ProposalItem[]>([
    { title: "", description: "", quantity: 1, unitPrice: 0, total: 0 }
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  // Filter leads when client changes
  useEffect(() => {
    if (formData.clientId) {
      // Filter leads that belong to the selected client
      const clientLeads = leads.filter(lead => lead.clientId === formData.clientId)
      setFilteredLeads(clientLeads)
      // Clear lead selection if current lead doesn't belong to selected client
      if (formData.leadId && !clientLeads.find(lead => lead.id === formData.leadId)) {
        setFormData(prev => ({ ...prev, leadId: '' }))
      }
    } else {
      // Show all leads if no client is selected
      setFilteredLeads(leads)
    }
  }, [formData.clientId, leads, formData.leadId])

  const fetchData = async () => {
    try {
      const [clientsRes, leadsRes, projectsRes, usersRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/leads'),
        fetch('/api/projects'),
        fetch('/api/users')
      ])

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData.clients || [])
      }

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json()
        setLeads(leadsData.leads || [])
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.projects || [])
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
        // Set current user as default creator (you might want to get this from auth context)
        if (usersData.users && usersData.users.length > 0) {
          setFormData(prev => ({ ...prev, createdBy: usersData.users[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleItemChange = (index: number, field: keyof ProposalItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { title: "", description: "", quantity: 1, unitPrice: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const total = calculateTotal()
      const validItems = items.filter(item => item.title.trim() !== "")

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          total: total > 0 ? total : null,
          items: validItems
        }),
      })

      if (response.ok) {
        const proposal = await response.json()
        router.push(`/dashboard/proposals/${proposal.id}`)
      } else {
        const errorData = await response.json()
        if (errorData.errors) {
          setErrors(errorData.errors)
        } else {
          setErrors({ general: errorData.error || 'Erro ao criar proposta' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Erro de conexão' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Nova Proposta">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/proposals">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Nova Proposta</h1>
              <p className="text-sm text-slate-400">Criar uma nova proposta comercial</p>
            </div>
          </div>
          
          <Button 
            type="submit" 
            form="new-proposal-form"
            disabled={loading}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Criar Proposta
          </Button>
        </div>

        {/* Form */}
        <form id="new-proposal-form" onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          {/* Basic Information */}
          <Card variant="elevated" className="bg-slate-800/30 border-slate-700/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Informações Básicas
              </CardTitle>
              <CardDescription>
                Dados principais da proposta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Título da Proposta"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ex: Desenvolvimento de Website Corporativo"
                    error={errors.title}
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100 block">
                      Descrição
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Breve descrição da proposta..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100 block">
                      Cliente
                    </label>
                    <select
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecionar cliente</option>
                      {Array.isArray(clients) && clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100 block">
                      Lead {formData.clientId && <span className="text-xs text-slate-400">(filtrado por cliente)</span>}
                    </label>
                    <select
                      name="leadId"
                      value={formData.leadId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecionar lead</option>
                      {filteredLeads.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.name} {lead.company && `(${lead.company})`}
                        </option>
                      ))}
                      {formData.clientId && filteredLeads.length === 0 && (
                        <option disabled>Nenhum lead encontrado para este cliente</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100 block">
                      Projeto
                    </label>
                    <select
                      name="projectId"
                      value={formData.projectId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecionar projeto</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Input
                    label="Válida até"
                    name="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={handleChange}
                    error={errors.validUntil}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card variant="elevated" className="bg-slate-800/30 border-slate-700/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="w-5 h-5 text-green-400" />
                    Itens da Proposta
                  </CardTitle>
                  <CardDescription>
                    Adicione os serviços ou produtos incluídos
                  </CardDescription>
                </div>
                <Button type="button" onClick={addItem} variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-3">
                        <Input
                          label="Título"
                          value={item.title}
                          onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                          placeholder="Nome do serviço/produto"
                          size="sm"
                        />
                      </div>
                      <div className="lg:col-span-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-100 block">
                            Descrição
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Descrição do item"
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="lg:col-span-1">
                        <Input
                          label="Qtd"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          size="sm"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <Input
                          label="Preço Unit."
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          size="sm"
                        />
                      </div>
                      <div className="lg:col-span-2 flex items-end gap-2">
                        <div className="flex-1">
                          <label className="text-sm font-medium text-slate-100 block mb-2">
                            Total
                          </label>
                          <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm text-right">
                            €{item.total.toFixed(2)}
                          </div>
                        </div>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeItem(index)}
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="flex justify-end pt-4 border-t border-slate-700">
                  <div className="text-right">
                    <div className="text-sm text-slate-400 mb-1">Total da Proposta</div>
                    <div className="text-2xl font-bold text-slate-100">
                      €{calculateTotal().toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Save Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-blue-600 hover:bg-blue-700 min-w-[140px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Criar Proposta
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
