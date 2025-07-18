"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Loader2, User, Building, Target } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  role: string
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    NEW: "Novo",
    CONTACTED: "Contactado",
    QUALIFIED: "Qualificado",
    PROPOSAL: "Proposta",
    NEGOTIATION: "Negociação",
    WON: "Ganho",
    LOST: "Perdido"
  }
  return statusMap[status] || status
}

function NewLeadForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: searchParams.get('status') || "NEW",
    source: "",
    value: "",
    probability: "",
    expectedCloseDate: "",
    notes: "",
    assignedTo: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        // API returns { users: [...] }
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users)
        } else {
          console.warn('Users API returned unexpected format:', data)
          setUsers([])
        }
      } else {
        console.error('Failed to fetch users:', response.status)
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
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

      const response = await fetch('/api/leads', {
        method: 'POST',
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
        setErrors({ general: error.error || 'Erro ao criar lead' })
      }
    } catch (error) {
      console.error('Error creating lead:', error)
      setErrors({ general: 'Erro ao criar lead' })
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

  return (
    <DashboardLayout title="Novo Lead">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/leads">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Adicionar Novo Lead</h1>
            <p className="text-slate-400">
              {searchParams.get('status')
                ? `Criar um novo lead na coluna "${getStatusLabel(searchParams.get('status') || 'NEW')}"`
                : "Criar um novo lead no sistema"
              }
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          {/* Personal Information */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Dados básicos do lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nome Completo"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: João Silva"
                error={errors.name}
                required
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
              />

              <Input
                label="Telefone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+351 912 345 678"
                error={errors.phone}
              />
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-green-400" />
                Informações da Empresa
              </CardTitle>
              <CardDescription>
                Dados da empresa do lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Empresa"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Nome da empresa"
                error={errors.company}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-100 block">
                  Fonte
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full h-12 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecionar fonte</option>
                  <option value="WEBSITE">Website</option>
                  <option value="SOCIAL_MEDIA">Redes Sociais</option>
                  <option value="EMAIL_MARKETING">Email Marketing</option>
                  <option value="REFERRAL">Referência</option>
                  <option value="COLD_CALL">Chamada Fria</option>
                  <option value="EVENT">Evento</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Qualification */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Qualificação e Estado
              </CardTitle>
              <CardDescription>
                Estado e pontuação do lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-100 block">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full h-12 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                <Input
                  label="Valor Estimado (€)"
                  name="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.value}
                  onChange={handleChange}
                  placeholder="Ex: 5000.00"
                  error={errors.value}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Probabilidade (%)"
                  name="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={handleChange}
                  placeholder="Ex: 75"
                  error={errors.probability}
                />

                <Input
                  label="Data de Fecho Prevista"
                  name="expectedCloseDate"
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={handleChange}
                  error={errors.expectedCloseDate}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-100 block">
                  Responsável
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full h-12 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecionar responsável</option>
                  {Array.isArray(users) && users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-100 block">
                  Notas
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Adicione notas sobre o lead..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link href="/dashboard/leads">
              <Button variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" loading={loading} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Criar Lead
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default function NewLeadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewLeadForm />
    </Suspense>
  )
}
