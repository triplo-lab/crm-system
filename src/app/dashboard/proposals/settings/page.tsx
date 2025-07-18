'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

interface CompanySettings {
  id?: string
  name: string
  address: string
  city: string
  postalCode: string
  country: string
  phone: string
  email: string
  website: string
  logo: string
  taxNumber: string
}

export default function ProposalSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    taxNumber: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/company-settings')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setSettings(data)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('O ficheiro deve ter menos de 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSettings(prev => ({
          ...prev,
          logo: result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setSettings(prev => ({
      ...prev,
      logo: ''
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const method = settings.id ? 'PUT' : 'POST'
      const url = settings.id ? `/api/company-settings/${settings.id}` : '/api/company-settings'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        toast.success('Configurações guardadas com sucesso!')
      } else {
        throw new Error('Erro ao guardar configurações')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Erro ao guardar configurações')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/proposals')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-200">Configurações da Empresa</h1>
            <p className="text-slate-300">Configure os dados da empresa para as propostas</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'A guardar...' : 'Guardar'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-1">Nome da Empresa *</label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome da sua empresa"
                className="text-slate-200 bg-slate-800 border-slate-600"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-200 mb-1">Morada</label>
              <textarea
                id="address"
                value={settings.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Morada completa"
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-slate-200 mb-1">Código Postal</label>
                <Input
                  id="postalCode"
                  value={settings.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="0000-000"
                  className="text-slate-200 bg-slate-800 border-slate-600"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-200 mb-1">Cidade</label>
                <Input
                  id="city"
                  value={settings.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Cidade"
                  className="text-slate-200 bg-slate-800 border-slate-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-slate-200 mb-1">País</label>
              <Input
                id="country"
                value={settings.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Portugal"
                className="text-slate-200 bg-slate-800 border-slate-600"
              />
            </div>

            <div>
              <label htmlFor="taxNumber" className="block text-sm font-medium text-slate-200 mb-1">Número de Contribuinte</label>
              <Input
                id="taxNumber"
                value={settings.taxNumber}
                onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                placeholder="000000000"
                className="text-slate-200 bg-slate-800 border-slate-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contactos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-200 mb-1">Telefone</label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+351 000 000 000"
                className="text-slate-200 bg-slate-800 border-slate-600"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1">Email</label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="empresa@exemplo.com"
                className="text-slate-200 bg-slate-800 border-slate-600"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-slate-200 mb-1">Website</label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.exemplo.com"
                className="text-slate-200 bg-slate-800 border-slate-600"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Logo da Empresa</label>
              <div className="mt-2">
                {settings.logo ? (
                  <div className="relative inline-block">
                    <img
                      src={settings.logo}
                      alt="Logo da empresa"
                      className="h-24 w-auto border border-gray-300 rounded"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeLogo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                          Carregar logo
                        </span>
                        <input
                          id="logo-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG até 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização do Cabeçalho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="flex items-center space-x-4">
              {settings.logo && (
                <div className="relative h-16 w-32">
                  <Image
                    src={settings.logo}
                    alt="Logo da Empresa"
                    fill
                    sizes="(max-width: 768px) 128px, 128px"
                    className="object-contain"
                  />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {settings.name || 'Nome da Empresa'}
                </h2>
                {(settings.address || settings.phone || settings.email || settings.website || settings.taxNumber) && (
                  <div className="text-sm text-slate-600 mt-1">
                    <p style={{ color: '#475569' }}>{settings.address || 'Rua da Tecnologia, 123'}</p>
                    <p style={{ color: '#475569' }}>
                      {settings.postalCode || '1000-001'} {settings.city || 'Lisboa'}{settings.country ? `, ${settings.country}` : ', Portugal'}
                    </p>
                    <p style={{ color: '#475569' }}>Tel: {settings.phone || '+351 210 000 000'}</p>
                    <p style={{ color: '#475569' }}>Email: {settings.email || 'info@techsolutions.pt'}</p>
                    <p style={{ color: '#475569' }}>Web: {settings.website || 'https://www.techsolutions.pt'}</p>
                    <p style={{ color: '#475569' }}>NIF: {settings.taxNumber || '123456789'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
