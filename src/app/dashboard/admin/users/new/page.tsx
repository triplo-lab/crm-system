"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Loader2, User, Mail, Lock, Shield } from "lucide-react"
import Link from "next/link"

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "EMPLOYEE",
    status: "ACTIVE"
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    
    if (!formData.password) {
      newErrors.password = "Password é obrigatória"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password deve ter pelo menos 6 caracteres"
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords não coincidem"
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    try {
      setLoading(true)
      setErrors({})
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status
        })
      })

      if (response.ok) {
        router.push('/dashboard/admin')
      } else {
        const error = await response.json()
        setErrors({ general: error.error || 'Erro ao criar utilizador' })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setErrors({ general: 'Erro ao criar utilizador' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    <DashboardLayout title="Novo Utilizador">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Adicionar Novo Utilizador</h1>
            <p className="text-slate-400">Criar uma nova conta de utilizador no sistema</p>
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

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Dados básicos do utilizador
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
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-400" />
                Credenciais de Acesso
              </CardTitle>
              <CardDescription>
                Password e confirmação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                error={errors.password}
                required
              />

              <Input
                label="Confirmar Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                error={errors.confirmPassword}
                required
              />
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Permissões e Estado
              </CardTitle>
              <CardDescription>
                Função e estado do utilizador no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-100 block">
                    Função
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full h-12 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EMPLOYEE">Funcionário</option>
                    <option value="MANAGER">Gestor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                  <p className="text-xs text-slate-500">
                    {formData.role === 'ADMIN' && 'Acesso total ao sistema'}
                    {formData.role === 'MANAGER' && 'Pode gerir projetos e equipas'}
                    {formData.role === 'EMPLOYEE' && 'Acesso básico ao sistema'}
                  </p>
                </div>

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
                    <option value="ACTIVE">Ativo</option>
                    <option value="PENDING">Pendente</option>
                    <option value="INACTIVE">Inativo</option>
                  </select>
                  <p className="text-xs text-slate-500">
                    {formData.status === 'ACTIVE' && 'Utilizador pode aceder ao sistema'}
                    {formData.status === 'PENDING' && 'Aguarda ativação'}
                    {formData.status === 'INACTIVE' && 'Sem acesso ao sistema'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link href="/dashboard/admin">
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
              Criar Utilizador
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
