'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectOption,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  User,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText
} from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  website?: string
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT'
  source?: string
  assignedTo?: string
  notes?: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchClient(params.id as string)
      fetchUsers()
    }
  }, [params.id])

  const fetchClient = async (id: string) => {
    try {
      const response = await fetch(`/api/clients/${id}`)
      
      if (!response.ok) {
        throw new Error('Cliente não encontrado')
      }
      
      const data = await response.json()
      setClient(data)
    } catch (error) {
      console.error('Error fetching client:', error)
      setError(error instanceof Error ? error.message : 'Erro ao carregar cliente')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        // API returns { users: [...], pagination: {...} }
        setUsers(Array.isArray(data.users) ? data.users : [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([]) // Set empty array on error
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!client) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(client),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar cliente')
      }

      router.push(`/dashboard/clients/${client.id}`)
    } catch (error) {
      console.error('Error updating client:', error)
      setError(error instanceof Error ? error.message : 'Erro ao atualizar cliente')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof Client, value: string) => {
    if (!client) return
    
    setClient({
      ...client,
      [field]: value || undefined
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>A carregar cliente...</span>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            {error || 'Cliente não encontrado'}
          </h3>
          <p className="text-slate-400 mb-4">
            O cliente que procura não existe ou foi removido.
          </p>
          <Link href="/dashboard/clients">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Clientes
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/clients/${client.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Editar Cliente</h1>
            <p className="text-slate-400">{client.name}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações do Cliente
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
                      value={client.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-100"
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
                      value={client.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={client.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-slate-300">
                      Empresa
                    </Label>
                    <Input
                      id="company"
                      value={client.company || ''}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-slate-300">
                      Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={client.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="https://exemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source" className="text-slate-300">
                      Origem
                    </Label>
                    <Input
                      id="source"
                      value={client.source || ''}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="Website, Referência, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-300">
                    Endereço
                  </Label>
                  <Input
                    id="address"
                    value={client.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-slate-300">
                    Notas
                  </Label>
                  <Textarea
                    id="notes"
                    value={client.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-100 min-h-[100px]"
                    placeholder="Notas adicionais sobre o cliente..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configurações */}
          <div>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100 text-sm">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-300">
                    Status
                  </Label>
                  <Select
                    value={client.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  >
                    <SelectOption value="ACTIVE">Ativo</SelectOption>
                    <SelectOption value="INACTIVE">Inativo</SelectOption>
                    <SelectOption value="PROSPECT">Prospeto</SelectOption>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo" className="text-slate-300">
                    Responsável
                  </Label>
                  <Select
                    value={client.assignedTo || ''}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  >
                    <SelectOption value="">Selecionar responsável</SelectOption>
                    {Array.isArray(users) && users.map((user) => (
                      <SelectOption key={user.id} value={user.id}>
                        {user.name}
                      </SelectOption>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href={`/dashboard/clients/${client.id}`}>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A guardar...
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
  )
}
