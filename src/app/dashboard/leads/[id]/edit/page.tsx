"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Loader2, User, Mail, Building, Target, FileText } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function EditLeadPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "NEW",
    source: "",
    value: "",
    probability: "",
    expectedCloseDate: "",
    notes: "",
    assignedTo: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (params.id) {
      fetchLead()
    }
    fetchUsers()
  }, [params.id])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data.users) ? data.users : Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchLead = async () => {
    try {
      setLoadingData(true)
      const response = await fetch(`/api/leads/${params.id}`)
      if (response.ok) {
        const lead = await response.json()
        setFormData({
          name: lead.name || "",
          email: lead.email || "",
          phone: lead.phone || "",
          company: lead.company || "",
          status: lead.status || "NEW",
          source: lead.source || "",
          value: lead.value ? lead.value.toString() : "",
          probability: lead.probability ? lead.probability.toString() : "",
          expectedCloseDate: lead.expectedCloseDate ? lead.expectedCloseDate.split('T')[0] : "",
          notes: lead.notes || "",
          assignedTo: lead.assignedTo || ""
        })
      } else {
        console.error('Failed to fetch lead')
        router.push('/dashboard/leads')
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
      router.push('/dashboard/leads')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Formato de email inválido"
    }
    
    if (formData.value && isNaN(Number(formData.value))) {
      newErrors.value = "Valor deve ser um número válido"
    }
    
    if (formData.probability && (isNaN(Number(formData.probability)) || Number(formData.probability) < 0 || Number(formData.probability) > 100)) {
      newErrors.probability = "Probabilidade deve ser um número entre 0 e 100"
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    try {
      setLoading(true)
      setErrors({})
      
      const response = await fetch(`/api/leads/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          status: formData.status,
          source: formData.source || null,
          value: formData.value ? Number(formData.value) : null,
          probability: formData.probability ? Number(formData.probability) : null,
          expectedCloseDate: formData.expectedCloseDate || null,
          notes: formData.notes || null,
          assignedTo: formData.assignedTo.trim() || null
        })
      })

      if (response.ok) {
        router.push('/dashboard/leads')
      } else {
        const error = await response.json()
        setErrors({ general: error.error || 'Erro ao atualizar lead' })
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      setErrors({ general: 'Erro ao atualizar lead' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  if (loadingData) {
    return (
      <DashboardLayout title="Editar Lead">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Editar Lead">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Compacto */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/leads/${params.id}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Editar Lead</h1>
              <p className="text-sm text-slate-400">Atualizar informações do lead</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              form="edit-lead-form"
              disabled={loading}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </Button>
          </div>
        </div>

        {/* Formulário Compacto */}
        <form id="edit-lead-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Erro Geral */}
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          {/* Card Principal com Grid */}
          <Card variant="elevated" className="bg-slate-800/30 border-slate-700/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Informações do Lead</CardTitle>
              <CardDescription className="text-sm">
                Atualize os dados do lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Coluna 1: Informações Pessoais */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Dados Pessoais
                  </h4>

                  <Input
                    label="Nome Completo"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: João Silva"
                    error={errors.name}
                    required
                    className="text-sm"
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="joao@exemplo.com"
                    error={errors.email}
                    required
                    className="text-sm"
                  />

                  <Input
                    label="Telefone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+351 912 345 678"
                    error={errors.phone}
                    className="text-sm"
                  />
                </div>

                {/* Coluna 2: Empresa e Status */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-400" />
                    Empresa e Status
                  </h4>

                  <Input
                    label="Empresa"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Nome da empresa"
                    error={errors.company}
                    className="text-sm"
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100 block">
                      Fonte
                    </label>
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecionar fonte</option>
                      <option value="website">Website</option>
                      <option value="referral">Referência</option>
                      <option value="social_media">Redes Sociais</option>
                      <option value="email_marketing">Email Marketing</option>
                      <option value="cold_call">Chamada Fria</option>
                      <option value="event">Evento</option>
                      <option value="other">Outro</option>
                    </select>
                    {errors.source && (
                      <p className="text-red-400 text-xs">{errors.source}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100 block">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="NEW">Novo</option>
                      <option value="CONTACTED">Contactado</option>
                      <option value="QUALIFIED">Qualificado</option>
                      <option value="PROPOSAL">Proposta</option>
                      <option value="NEGOTIATION">Negociação</option>
                      <option value="WON">Ganho</option>
                      <option value="LOST">Perdido</option>
                    </select>
                  </div>
                </div>

                {/* Coluna 3: Vendas */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-400" />
                    Informações de Vendas
                  </h4>

                  <Input
                    label="Valor Estimado (€)"
                    name="value"
                    type="number"
                    value={formData.value}
                    onChange={handleChange}
                    placeholder="5000"
                    error={errors.value}
                    className="text-sm"
                  />

                  <Input
                    label="Probabilidade (%)"
                    name="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={handleChange}
                    placeholder="75"
                    error={errors.probability}
                    className="text-sm"
                  />

                  <Input
                    label="Data de Fecho Prevista"
                    name="expectedCloseDate"
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={handleChange}
                    error={errors.expectedCloseDate}
                    className="text-sm"
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-100 block">
                      Responsável
                    </label>
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Não atribuído</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Notas */}
          <Card variant="elevated" className="bg-slate-800/30 border-slate-700/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-400" />
                Notas
              </CardTitle>
              <CardDescription className="text-sm">
                Informações adicionais sobre o lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-100 block">
                  Observações
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Adicione observações sobre o lead..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {errors.notes && (
                  <p className="text-red-400 text-xs">{errors.notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
