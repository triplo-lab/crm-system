"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Calendar,
  Euro,
  Loader2,
  Eye,
  Edit,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"

interface Invoice {
  id: string
  number: string
  type: 'INVOICE' | 'QUOTE' | 'RECEIPT'
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  client: {
    id: string
    name: string
    company?: string
  }
  project?: {
    id: string
    name: string
  }
  issueDate: string
  dueDate: string
  paidDate?: string
  subtotal: number
  tax: number
  total: number
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      case 'SENT':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'PAID':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'OVERDUE':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'CANCELLED':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Rascunho'
      case 'SENT':
        return 'Enviada'
      case 'PAID':
        return 'Paga'
      case 'OVERDUE':
        return 'Atrasada'
      case 'CANCELLED':
        return 'Cancelada'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-4 h-4" />
      case 'SENT':
        return <Send className="w-4 h-4" />
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'INVOICE':
        return 'Fatura'
      case 'QUOTE':
        return 'Orçamento'
      case 'RECEIPT':
        return 'Recibo'
      default:
        return type
    }
  }

  const filteredInvoices = Array.isArray(invoices) ? invoices.filter(invoice => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.client.company && invoice.client.company.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    const matchesType = typeFilter === "all" || invoice.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  }) : []

  if (loading) {
    return (
      <DashboardLayout title="Faturação">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Faturação">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Pesquisar faturas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Tipos</option>
              <option value="INVOICE">Faturas</option>
              <option value="QUOTE">Orçamentos</option>
              <option value="RECEIPT">Recibos</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Estados</option>
              <option value="DRAFT">Rascunho</option>
              <option value="SENT">Enviada</option>
              <option value="PAID">Paga</option>
              <option value="OVERDUE">Atrasada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
          <Link href="/dashboard/invoices/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Fatura
            </Button>
          </Link>
        </div>

        {/* Invoices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} variant="elevated" hover>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{invoice.number}</CardTitle>
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                        {getTypeText(invoice.type)}
                      </span>
                    </div>
                    <CardDescription className="line-clamp-1">
                      {invoice.client.name} {invoice.client.company && `- ${invoice.client.company}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {getStatusText(invoice.status)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project */}
                {invoice.project && (
                  <div className="text-sm">
                    <span className="text-slate-400">Projeto: </span>
                    <span className="text-slate-300">{invoice.project.name}</span>
                  </div>
                )}

                {/* Amount */}
                <div className="space-y-1">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-slate-400">Total</span>
                    <span className="text-slate-100">{formatCurrency(invoice.total)}</span>
                  </div>
                  {invoice.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">IVA</span>
                      <span className="text-slate-400">{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">
                      Emitida: {formatDate(invoice.issueDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">
                      Vencimento: {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                  {invoice.paidDate && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">
                        Paga: {formatDate(invoice.paidDate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="w-4 h-4" />
                      Ver
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredInvoices.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all" ? "Nenhuma fatura encontrada" : "Nenhuma fatura criada"}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Tente ajustar os filtros de pesquisa" 
                : "Comece criando a sua primeira fatura"}
            </p>
            {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
              <Link href="/dashboard/invoices/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeira Fatura
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
