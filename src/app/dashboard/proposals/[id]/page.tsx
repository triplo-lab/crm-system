'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Download, Printer, Edit, Settings, Check, X, Shield, UserCheck, Trash2 } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { formatCurrency, formatDate } from '@/lib/utils'
import '@/styles/pdf.css'

interface ProposalItem {
  id: string
  title: string
  description?: string
  quantity: number
  unitPrice: number
  total: number
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
  leadId?: string
  adminApproved: boolean
  adminApprovedAt?: string
  clientApproved: boolean
  clientApprovedAt?: string
  client?: {
    name: string
    email: string
    phone?: string
    address?: string
  }
  lead?: {
    id: string
    name: string
    email: string
    company?: string
  }
  items: ProposalItem[]
  createdAt: string
  updatedAt: string
}

interface CompanySettings {
  id: string
  name: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  taxNumber?: string
}

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingApproval, setUpdatingApproval] = useState<string | null>(null)
  const [movingToTrash, setMovingToTrash] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProposal()
    fetchCompanySettings()
  }, [params.id])

  const fetchProposal = async () => {
    try {
      const response = await fetch(`/api/proposals/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProposal(data)
      }
    } catch (error) {
      console.error('Error fetching proposal:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch('/api/company-settings')
      if (response.ok) {
        const data = await response.json()
        setCompanySettings(data)
      }
    } catch (error) {
      console.error('Error fetching company settings:', error)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Proposta-${proposal?.title || 'Documento'}`,
  })

  const handleDownloadPDF = async () => {
    if (!printRef.current || !proposal) {
      console.error('Referência do elemento ou proposta não encontrada')
      return
    }

    setDownloadingPDF(true)

    try {
      console.log('Iniciando geração de PDF...')

      // Aguardar um momento para garantir que o DOM está pronto
      await new Promise(resolve => setTimeout(resolve, 500))

      // Criar uma versão simplificada do elemento para PDF
      const originalElement = printRef.current
      const clonedElement = originalElement.cloneNode(true) as HTMLElement

      // Aplicar estilos inline para evitar problemas de CSS
      const applyInlineStyles = (element: HTMLElement) => {
        element.style.backgroundColor = 'white'
        element.style.color = 'black'
        element.style.fontFamily = 'Arial, sans-serif'
        element.style.fontSize = '14px'
        element.style.lineHeight = '1.5'

        // Aplicar estilos aos filhos
        const children = element.querySelectorAll('*') as NodeListOf<HTMLElement>
        children.forEach(child => {
          child.style.backgroundColor = 'white'
          child.style.color = 'black'
          child.style.borderColor = '#e5e5e5'

          // Remover classes problemáticas
          child.className = child.className
            .replace(/bg-\w+-\d+/g, '')
            .replace(/text-\w+-\d+/g, '')
            .replace(/border-\w+-\d+/g, '')
            .replace(/dark:/g, '')
        })
      }

      applyInlineStyles(clonedElement)

      // Adicionar o elemento clonado temporariamente ao DOM
      clonedElement.style.position = 'absolute'
      clonedElement.style.left = '-9999px'
      clonedElement.style.top = '0'
      clonedElement.style.width = '210mm'
      clonedElement.style.backgroundColor = 'white'
      document.body.appendChild(clonedElement)

      try {
        const canvas = await html2canvas(clonedElement, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          removeContainer: false,
          foreignObjectRendering: false
        })

        console.log('Canvas criado com sucesso')

        const imgData = canvas.toDataURL('image/png', 0.95)
        const pdf = new jsPDF('p', 'mm', 'a4')

        const imgWidth = 210
        const pageHeight = 295
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight

        let position = 0

        // Adicionar primeira página
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        // Adicionar páginas adicionais se necessário
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        // Salvar o PDF
        const fileName = `Proposta-${proposal.title.replace(/[^a-zA-Z0-9\s]/g, '_')}.pdf`
        pdf.save(fileName)

        console.log('PDF gerado com sucesso:', fileName)

        // Log da atividade
        try {
          await fetch('/api/system-activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'DOWNLOAD_PDF',
              entityType: 'PROPOSAL',
              entityId: proposal.id,
              entityName: proposal.title,
              description: `Download PDF da proposta: ${proposal.title}`
            })
          })
        } catch (logError) {
          console.error('Erro ao registar atividade:', logError)
        }

      } finally {
        // Remover elemento clonado
        document.body.removeChild(clonedElement)
      }

    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Por favor, tente novamente.')
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleApprovalUpdate = async (type: 'admin' | 'client', approved: boolean) => {
    if (!proposal) return

    setUpdatingApproval(type)
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/approvals`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          approved,
          userId: 'current-user-id' // TODO: Get from auth context
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update approval')
      }

      const updatedData = await response.json()

      // Update the proposal state
      setProposal(prev => prev ? {
        ...prev,
        adminApproved: updatedData.adminApproved,
        adminApprovedAt: updatedData.adminApprovedAt,
        clientApproved: updatedData.clientApproved,
        clientApprovedAt: updatedData.clientApprovedAt,
      } : null)

    } catch (error) {
      console.error('Error updating approval:', error)
      alert('Erro ao atualizar aprovação')
    } finally {
      setUpdatingApproval(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SENT': return 'bg-blue-100 text-blue-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'EXPIRED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Rascunho'
      case 'SENT': return 'Enviada'
      case 'ACCEPTED': return 'Aceite'
      case 'REJECTED': return 'Rejeitada'
      case 'EXPIRED': return 'Expirada'
      default: return status
    }
  }

  const handleMoveToTrash = async () => {
    if (!proposal) return

    const confirmed = window.confirm(
      `Tem certeza que deseja mover a proposta "${proposal.title}" para a lixeira?\n\nPoderá restaurá-la posteriormente.`
    )

    if (!confirmed) return

    try {
      setMovingToTrash(true)
      const response = await fetch(`/api/proposals/${proposal.id}/trash`, {
        method: 'POST'
      })

      if (response.ok) {
        router.push('/dashboard/proposals')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao mover proposta para a lixeira')
      }
    } catch (error) {
      console.error('Error moving proposal to trash:', error)
      alert('Erro ao mover proposta para a lixeira')
    } finally {
      setMovingToTrash(false)
    }
  }

  const handleDelete = async () => {
    if (!proposal) return

    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: Eliminar permanentemente a proposta "${proposal.title}"?\n\nEsta ação NÃO PODE ser desfeita!\n\nTodos os dados da proposta serão perdidos para sempre.`
    )

    if (!confirmed) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/dashboard/proposals')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao eliminar proposta')
      }
    } catch (error) {
      console.error('Error deleting proposal:', error)
      alert('Erro ao eliminar proposta')
    } finally {
      setDeleting(false)
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
          <p className="text-gray-600 mb-4">A proposta que procura não existe ou foi removida.</p>
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
        {/* Header Actions */}
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
            <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
            <div className="text-gray-600 space-y-1">
              {proposal.client && <p>Cliente: {proposal.client.name}</p>}
              {proposal.lead && (
                <p>Lead: {proposal.lead.name} {proposal.lead.company && `(${proposal.lead.company})`}</p>
              )}
              {!proposal.client && !proposal.lead && <p>Sem cliente ou lead associado</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(proposal.status)}>
            {getStatusText(proposal.status)}
          </Badge>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/proposals/settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/proposals/${proposal.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
          >
            {downloadingPDF ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                A gerar PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleMoveToTrash}
            disabled={movingToTrash}
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {movingToTrash ? 'A mover...' : 'Lixeira'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <X className="w-4 h-4 mr-2" />
            {deleting ? 'A eliminar...' : 'Eliminar'}
          </Button>
        </div>
      </div>

      {/* Approval Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Approval */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-blue-500" />
              Aprovação do Administrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {proposal.adminApproved ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 rounded-lg">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 font-medium">Aprovado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
                      <X className="w-5 h-5 text-red-500" />
                      <span className="text-red-600 font-medium">Não Aprovado</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={proposal.adminApproved ? "outline" : "default"}
                    onClick={() => handleApprovalUpdate('admin', true)}
                    disabled={updatingApproval === 'admin'}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600"
                  >
                    <Check className="w-4 h-4" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprovalUpdate('admin', false)}
                    disabled={updatingApproval === 'admin'}
                    className="gap-2 border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                    Rejeitar
                  </Button>
                </div>
              </div>
              {proposal.adminApprovedAt && (
                <p className="text-sm text-gray-500">
                  Aprovado em: {formatDate(proposal.adminApprovedAt)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Approval */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="w-5 h-5 text-green-500" />
              Aprovação do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {proposal.clientApproved ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 rounded-lg">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 font-medium">Aprovado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
                      <X className="w-5 h-5 text-red-500" />
                      <span className="text-red-600 font-medium">Não Aprovado</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={proposal.clientApproved ? "outline" : "default"}
                    onClick={() => handleApprovalUpdate('client', true)}
                    disabled={updatingApproval === 'client'}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600"
                  >
                    <Check className="w-4 h-4" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprovalUpdate('client', false)}
                    disabled={updatingApproval === 'client'}
                    className="gap-2 border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                    Rejeitar
                  </Button>
                </div>
              </div>
              {proposal.clientApprovedAt && (
                <p className="text-sm text-gray-500">
                  Aprovado em: {formatDate(proposal.clientApprovedAt)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Printable Content */}
      <div
        ref={printRef}
        className="pdf-content"
        style={{
          backgroundColor: 'white',
          color: 'black',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.5',
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        <Card className="border-none shadow-none" style={{ backgroundColor: 'white' }}>
          <CardContent className="p-0" style={{ backgroundColor: 'white' }}>
            {/* Company Header */}
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center space-x-4">
                {companySettings?.logo && (
                  <img
                    src={companySettings.logo}
                    alt="Logo da Empresa"
                    className="h-16 w-auto"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'black' }}>
                    {companySettings?.name || 'TechSolutions Lda'}
                  </h2>
                  <div className="text-sm mt-1" style={{ color: 'black' }}>
                    <p style={{ color: 'black' }}>
                      {companySettings?.address || 'Rua da Tecnologia, 123'}
                    </p>
                    <p style={{ color: 'black' }}>
                      {companySettings?.postalCode || '1000-001'} {companySettings?.city || 'Lisboa'}{companySettings?.country ? `, ${companySettings.country}` : ', Portugal'}
                    </p>
                    <p style={{ color: 'black' }}>
                      Tel: {companySettings?.phone || '+351 210 000 000'}
                    </p>
                    <p style={{ color: 'black' }}>
                      Email: {companySettings?.email || 'info@techsolutions.pt'}
                    </p>
                    <p style={{ color: 'black' }}>
                      Web: {companySettings?.website || 'https://www.techsolutions.pt'}
                    </p>
                    <p style={{ color: 'black' }}>
                      NIF: {companySettings?.taxNumber || '123456789'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <h3 className="text-xl font-bold mb-2" style={{ color: 'black' }}>PROPOSTA</h3>
                <p className="text-sm" style={{ color: 'black' }}>Data: {formatDate(proposal.createdAt)}</p>
                {proposal.validUntil && (
                  <p className="text-sm" style={{ color: 'black' }}>Válida até: {formatDate(proposal.validUntil)}</p>
                )}
              </div>
            </div>

            <div className="my-6" style={{ borderTop: '1px solid black' }}></div>

            {/* Client/Lead Information */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'black' }}>
                {proposal.client ? 'Cliente' : proposal.lead ? 'Lead' : 'Contacto'}
              </h4>
              <div className="p-4 rounded-lg border" style={{ backgroundColor: '#f5f5f5', borderColor: 'black' }}>
                {proposal.client && (
                  <>
                    <p className="font-medium" style={{ color: 'black' }}>{proposal.client.name}</p>
                    {proposal.client.email && <p className="text-sm" style={{ color: 'black' }}>{proposal.client.email}</p>}
                    {proposal.client.phone && <p className="text-sm" style={{ color: 'black' }}>{proposal.client.phone}</p>}
                    {proposal.client.address && <p className="text-sm" style={{ color: 'black' }}>{proposal.client.address}</p>}
                  </>
                )}
                {proposal.lead && !proposal.client && (
                  <>
                    <p className="font-medium" style={{ color: 'black' }}>{proposal.lead.name}</p>
                    {proposal.lead.company && <p className="text-sm" style={{ color: 'black' }}>{proposal.lead.company}</p>}
                    <p className="text-sm" style={{ color: 'black' }}>{proposal.lead.email}</p>
                  </>
                )}
              </div>
            </div>

            {/* Proposal Content */}
            {proposal.description && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-3" style={{ color: 'black' }}>Descrição</h4>
                <p style={{ color: 'black' }}>{proposal.description}</p>
              </div>
            )}

            {/* Proposal Items */}
            {proposal.items && proposal.items.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-3" style={{ color: 'black' }}>Itens da Proposta</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" style={{ border: '2px solid black' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#e5e5e5' }}>
                        <th className="px-4 py-2 text-left font-semibold" style={{ border: '1px solid black', color: 'black' }}>Item</th>
                        <th className="px-4 py-2 text-center font-semibold" style={{ border: '1px solid black', color: 'black' }}>Qtd</th>
                        <th className="px-4 py-2 text-right font-semibold" style={{ border: '1px solid black', color: 'black' }}>Preço Unit.</th>
                        <th className="px-4 py-2 text-right font-semibold" style={{ border: '1px solid black', color: 'black' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.items.map((item) => (
                        <tr key={item.id} style={{ backgroundColor: 'white' }}>
                          <td className="px-4 py-2" style={{ border: '1px solid black' }}>
                            <div>
                              <p className="font-medium" style={{ color: 'black' }}>{item.title}</p>
                              {item.description && (
                                <p className="text-sm" style={{ color: 'black' }}>{item.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center" style={{ border: '1px solid black', color: 'black' }}>
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-right" style={{ border: '1px solid black', color: 'black' }}>
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-2 text-right" style={{ border: '1px solid black', color: 'black' }}>
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold" style={{ backgroundColor: '#e5e5e5' }}>
                        <td colSpan={3} className="px-4 py-2 text-right" style={{ border: '1px solid black', color: 'black' }}>
                          Total:
                        </td>
                        <td className="px-4 py-2 text-right font-bold" style={{ border: '1px solid black', color: 'black' }}>
                          {formatCurrency(proposal.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Additional Content */}
            {proposal.content && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-3" style={{ color: 'black' }}>Detalhes Adicionais</h4>
                <div
                  className="prose max-w-none"
                  style={{ color: 'black' }}
                  dangerouslySetInnerHTML={{ __html: proposal.content }}
                />
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 text-center text-sm" style={{ borderTop: '1px solid black', color: 'black' }}>
              <p style={{ color: 'black' }}>Esta proposta é válida por 30 dias a partir da data de emissão.</p>
              <p className="mt-2" style={{ color: 'black' }}>Obrigado pela sua confiança!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
