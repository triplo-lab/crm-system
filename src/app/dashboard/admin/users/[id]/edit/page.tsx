"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectOption } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  User,
  Mail,
  Shield,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  avatar?: string
}

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
    password: "",
    confirmPassword: ""
  })

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          role: userData.role || "",
          status: userData.status || "",
          password: "",
          confirmPassword: ""
        })
      } else {
        toast.error("Erro ao carregar dados do utilizador")
        router.push("/dashboard/admin/users")
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      toast.error("Erro ao carregar dados do utilizador")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Nome e email são obrigatórios")
      return
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("As passwords não coincidem")
      return
    }

    if (formData.password && formData.password.length < 6) {
      toast.error("A password deve ter pelo menos 6 caracteres")
      return
    }

    setSaving(true)

    try {
      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        status: formData.status
      }

      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        toast.success("Utilizador atualizado com sucesso!")
        router.push(`/dashboard/admin/users/${userId}`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erro ao atualizar utilizador")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Erro ao atualizar utilizador")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            Utilizador não encontrado
          </h3>
          <Button onClick={() => router.push("/dashboard/admin/users")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Utilizadores
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/admin/users/${userId}`)}
              className="text-slate-400 hover:text-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                Editar Utilizador
              </h1>
              <p className="text-slate-400">
                Editar informações de {user.name}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-300">
                        Nome *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        placeholder="Nome completo"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        placeholder="email@exemplo.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300">
                        Nova Password (opcional)
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className="bg-slate-700 border-slate-600 text-slate-100 pr-10"
                          placeholder="Deixar vazio para manter atual"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-100"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-slate-300">
                        Confirmar Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        placeholder="Confirmar nova password"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings */}
            <div>
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Configurações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-slate-300">
                      Função
                    </Label>
                    <Select
                      value={formData.role}
                      onChange={(e) => handleInputChange("role", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                    >
                      <SelectOption value="ADMIN">Administrador</SelectOption>
                      <SelectOption value="MANAGER">Gestor</SelectOption>
                      <SelectOption value="EMPLOYEE">Colaborador</SelectOption>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-slate-300">
                      Estado
                    </Label>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleInputChange("status", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                    >
                      <SelectOption value="ACTIVE">Ativo</SelectOption>
                      <SelectOption value="INACTIVE">Inativo</SelectOption>
                      <SelectOption value="SUSPENDED">Suspenso</SelectOption>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/admin/users/${userId}`)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
