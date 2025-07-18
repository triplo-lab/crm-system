"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AvatarUpload } from "@/components/ui/avatar-upload"
import { toast } from "sonner"
import { Save, User, Mail, Shield } from "lucide-react"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string | null
  role: string
  createdAt: string
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setFormData({
          name: data.user.name || "",
          email: data.user.email || ""
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast.error("Erro ao carregar perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar')
      }

      setProfile(data.user)
      
      // Update session data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.user.name,
          email: data.user.email
        }
      })

      toast.success("Perfil atualizado com sucesso!")

    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast.error(error instanceof Error ? error.message : "Erro ao salvar perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpdate = async (avatarUrl: string | null) => {
    if (profile) {
      setProfile({ ...profile, avatar: avatarUrl })
      
      // Update session data
      await update({
        ...session,
        user: {
          ...session?.user,
          image: avatarUrl
        }
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-700 rounded w-1/3"></div>
            <div className="h-64 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-slate-100 mb-4">Erro ao carregar perfil</h1>
          <Button onClick={fetchProfile}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Meu Perfil</h1>
          <p className="text-slate-400">Gerencie suas informações pessoais e avatar</p>
        </div>

        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Avatar
            </CardTitle>
            <CardDescription>
              Sua foto de perfil será exibida em todo o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <AvatarUpload
              user={profile}
              onAvatarUpdate={handleAvatarUpdate}
              size="2xl"
            />
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize suas informações básicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Informações da Conta
            </CardTitle>
            <CardDescription>
              Detalhes da sua conta no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-400">Função</Label>
                <p className="text-slate-100 capitalize">{profile.role}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-slate-400">Membro desde</Label>
                <p className="text-slate-100">
                  {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
