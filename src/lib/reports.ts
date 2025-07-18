import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Report types
export interface ReportConfig {
  title: string
  dateRange: {
    start: Date
    end: Date
  }
  includeCharts: boolean
  includeDetails: boolean
  format: 'pdf' | 'excel'
  sections: {
    overview: boolean
    api: boolean
    cache: boolean
    performance: boolean
    alerts: boolean
    errors: boolean
  }
}

export interface ReportData {
  overview: {
    totalRequests: number
    avgResponseTime: number
    errorRate: number
    cacheHitRate: number
    uptime: number
    criticalAlerts: number
  }
  api: {
    stats: any
    endpoints: any[]
    recent: any[]
  }
  cache: {
    stats: any
    operations: any
  }
  performance: {
    metrics: any[]
    webVitals: any
  }
  alerts: {
    total: number
    critical: number
    recent: any[]
  }
  errors: {
    total: number
    recent: any[]
    byType: any
  }
  metadata: {
    generatedAt: Date
    period: string
    totalDataPoints: number
  }
}

// Report generator class
export class ReportGenerator {
  private config: ReportConfig
  private data: ReportData

  constructor(config: ReportConfig, data: ReportData) {
    this.config = config
    this.data = data
  }

  // Generate PDF report
  async generatePDF(): Promise<void> {
    const doc = new jsPDF()
    let yPosition = 20

    // Header
    yPosition = this.addPDFHeader(doc, yPosition)
    
    // Overview section
    if (this.config.sections.overview) {
      yPosition = this.addPDFOverview(doc, yPosition)
    }

    // API section
    if (this.config.sections.api) {
      yPosition = this.addPDFAPISection(doc, yPosition)
    }

    // Cache section
    if (this.config.sections.cache) {
      yPosition = this.addPDFCacheSection(doc, yPosition)
    }

    // Performance section
    if (this.config.sections.performance) {
      yPosition = this.addPDFPerformanceSection(doc, yPosition)
    }

    // Alerts section
    if (this.config.sections.alerts) {
      yPosition = this.addPDFAlertsSection(doc, yPosition)
    }

    // Errors section
    if (this.config.sections.errors) {
      yPosition = this.addPDFErrorsSection(doc, yPosition)
    }

    // Footer
    this.addPDFFooter(doc)

    // Save the PDF
    const fileName = `relatorio-monitorização-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`
    doc.save(fileName)
  }

  // Generate Excel report
  async generateExcel(): Promise<void> {
    const workbook = XLSX.utils.book_new()

    // Overview sheet
    if (this.config.sections.overview) {
      const overviewSheet = this.createOverviewSheet()
      XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Resumo Geral')
    }

    // API sheet
    if (this.config.sections.api) {
      const apiSheet = this.createAPISheet()
      XLSX.utils.book_append_sheet(workbook, apiSheet, 'APIs')
    }

    // Cache sheet
    if (this.config.sections.cache) {
      const cacheSheet = this.createCacheSheet()
      XLSX.utils.book_append_sheet(workbook, cacheSheet, 'Cache')
    }

    // Performance sheet
    if (this.config.sections.performance) {
      const performanceSheet = this.createPerformanceSheet()
      XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Performance')
    }

    // Alerts sheet
    if (this.config.sections.alerts) {
      const alertsSheet = this.createAlertsSheet()
      XLSX.utils.book_append_sheet(workbook, alertsSheet, 'Alertas')
    }

    // Errors sheet
    if (this.config.sections.errors) {
      const errorsSheet = this.createErrorsSheet()
      XLSX.utils.book_append_sheet(workbook, errorsSheet, 'Erros')
    }

    // Save the Excel file
    const fileName = `relatorio-monitorização-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, fileName)
  }

  // PDF Helper Methods
  private addPDFHeader(doc: jsPDF, y: number): number {
    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(this.config.title, 20, y)
    y += 15

    // Subtitle
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Período: ${format(this.config.dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} - ${format(this.config.dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}`, 20, y)
    y += 10

    doc.text(`Gerado em: ${format(this.data.metadata.generatedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, y)
    y += 20

    return y
  }

  private addPDFOverview(doc: jsPDF, y: number): number {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo Geral', 20, y)
    y += 15

    const overviewData = [
      ['Total de Requests', this.data.overview.totalRequests.toLocaleString()],
      ['Tempo Médio de Resposta', `${this.data.overview.avgResponseTime}ms`],
      ['Taxa de Erro', `${this.data.overview.errorRate}%`],
      ['Taxa de Hit do Cache', `${this.data.overview.cacheHitRate}%`],
      ['Uptime', this.formatUptime(this.data.overview.uptime)],
      ['Alertas Críticos', this.data.overview.criticalAlerts.toString()]
    ]

    doc.autoTable({
      startY: y,
      head: [['Métrica', 'Valor']],
      body: overviewData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 20, right: 20 }
    })

    return (doc as any).lastAutoTable.finalY + 20
  }

  private addPDFAPISection(doc: jsPDF, y: number): number {
    if (y > 200) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Performance das APIs', 20, y)
    y += 15

    const apiData = this.data.api.endpoints.slice(0, 10).map(endpoint => [
      endpoint.endpoint,
      endpoint.count.toString(),
      `${endpoint.avgResponseTime}ms`,
      `${endpoint.errorRate}%`
    ])

    doc.autoTable({
      startY: y,
      head: [['Endpoint', 'Requests', 'Tempo Médio', 'Taxa de Erro']],
      body: apiData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 20, right: 20 }
    })

    return (doc as any).lastAutoTable.finalY + 20
  }

  private addPDFCacheSection(doc: jsPDF, y: number): number {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Performance do Cache', 20, y)
    y += 15

    const cacheData = [
      ['Total de Operações', this.data.cache.stats.total?.toString() || '0'],
      ['Hits', this.data.cache.stats.hits?.toString() || '0'],
      ['Misses', this.data.cache.stats.misses?.toString() || '0'],
      ['Taxa de Hit', `${this.data.cache.stats.hitRate || 0}%`]
    ]

    doc.autoTable({
      startY: y,
      head: [['Métrica', 'Valor']],
      body: cacheData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 20, right: 20 }
    })

    return (doc as any).lastAutoTable.finalY + 20
  }

  private addPDFPerformanceSection(doc: jsPDF, y: number): number {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Métricas de Performance', 20, y)
    y += 15

    const performanceData = this.data.performance.metrics.slice(0, 10).map(metric => [
      metric.name,
      `${metric.value}${metric.unit}`,
      format(new Date(metric.timestamp), 'dd/MM HH:mm', { locale: ptBR })
    ])

    doc.autoTable({
      startY: y,
      head: [['Métrica', 'Valor', 'Timestamp']],
      body: performanceData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 20, right: 20 }
    })

    return (doc as any).lastAutoTable.finalY + 20
  }

  private addPDFAlertsSection(doc: jsPDF, y: number): number {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Alertas', 20, y)
    y += 15

    const alertsData = this.data.alerts.recent.slice(0, 10).map(alert => [
      alert.type.toUpperCase(),
      alert.message,
      format(new Date(alert.timestamp), 'dd/MM HH:mm', { locale: ptBR })
    ])

    doc.autoTable({
      startY: y,
      head: [['Tipo', 'Mensagem', 'Timestamp']],
      body: alertsData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 20, right: 20 }
    })

    return (doc as any).lastAutoTable.finalY + 20
  }

  private addPDFErrorsSection(doc: jsPDF, y: number): number {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Erros', 20, y)
    y += 15

    const errorsData = this.data.errors.recent.slice(0, 10).map(error => [
      error.severity.toUpperCase(),
      error.error.substring(0, 50) + (error.error.length > 50 ? '...' : ''),
      error.endpoint || 'N/A',
      format(new Date(error.timestamp), 'dd/MM HH:mm', { locale: ptBR })
    ])

    doc.autoTable({
      startY: y,
      head: [['Severidade', 'Erro', 'Endpoint', 'Timestamp']],
      body: errorsData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 20, right: 20 }
    })

    return (doc as any).lastAutoTable.finalY + 20
  }

  private addPDFFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10)
      doc.text('Sistema CRM - Relatório de Monitorização', 20, doc.internal.pageSize.height - 10)
    }
  }

  // Excel Helper Methods
  private createOverviewSheet(): XLSX.WorkSheet {
    const data = [
      ['Relatório de Monitorização - Resumo Geral'],
      [''],
      [`Período: ${format(this.config.dateRange.start, 'dd/MM/yyyy')} - ${format(this.config.dateRange.end, 'dd/MM/yyyy')}`],
      [`Gerado em: ${format(this.data.metadata.generatedAt, 'dd/MM/yyyy HH:mm')}`],
      [''],
      ['Métrica', 'Valor'],
      ['Total de Requests', this.data.overview.totalRequests],
      ['Tempo Médio de Resposta (ms)', this.data.overview.avgResponseTime],
      ['Taxa de Erro (%)', this.data.overview.errorRate],
      ['Taxa de Hit do Cache (%)', this.data.overview.cacheHitRate],
      ['Uptime', this.formatUptime(this.data.overview.uptime)],
      ['Alertas Críticos', this.data.overview.criticalAlerts]
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  private createAPISheet(): XLSX.WorkSheet {
    const headers = ['Endpoint', 'Requests', 'Tempo Médio (ms)', 'Taxa de Erro (%)']
    const data = [
      ['Performance das APIs'],
      [''],
      headers,
      ...this.data.api.endpoints.map(endpoint => [
        endpoint.endpoint,
        endpoint.count,
        endpoint.avgResponseTime,
        endpoint.errorRate
      ])
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  private createCacheSheet(): XLSX.WorkSheet {
    const data = [
      ['Performance do Cache'],
      [''],
      ['Métrica', 'Valor'],
      ['Total de Operações', this.data.cache.stats.total || 0],
      ['Hits', this.data.cache.stats.hits || 0],
      ['Misses', this.data.cache.stats.misses || 0],
      ['Taxa de Hit (%)', this.data.cache.stats.hitRate || 0],
      [''],
      ['Operações por Tipo'],
      ['Tipo', 'Quantidade'],
      ...Object.entries(this.data.cache.operations || {}).map(([type, count]) => [type, count])
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  private createPerformanceSheet(): XLSX.WorkSheet {
    const headers = ['Métrica', 'Valor', 'Unidade', 'Timestamp']
    const data = [
      ['Métricas de Performance'],
      [''],
      headers,
      ...this.data.performance.metrics.map(metric => [
        metric.name,
        metric.value,
        metric.unit,
        format(new Date(metric.timestamp), 'dd/MM/yyyy HH:mm')
      ])
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  private createAlertsSheet(): XLSX.WorkSheet {
    const headers = ['Tipo', 'Mensagem', 'Métrica', 'Valor', 'Limite', 'Timestamp']
    const data = [
      ['Alertas'],
      [''],
      headers,
      ...this.data.alerts.recent.map(alert => [
        alert.type,
        alert.message,
        alert.metric,
        alert.value,
        alert.threshold,
        format(new Date(alert.timestamp), 'dd/MM/yyyy HH:mm')
      ])
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  private createErrorsSheet(): XLSX.WorkSheet {
    const headers = ['Severidade', 'Erro', 'Endpoint', 'Timestamp']
    const data = [
      ['Erros'],
      [''],
      headers,
      ...this.data.errors.recent.map(error => [
        error.severity,
        error.error,
        error.endpoint || 'N/A',
        format(new Date(error.timestamp), 'dd/MM/yyyy HH:mm')
      ])
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  // Utility methods
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }
}

// Utility functions for report generation
export function createDefaultReportConfig(): ReportConfig {
  const end = new Date()
  const start = subDays(end, 7) // Last 7 days

  return {
    title: 'Relatório de Monitorização do Sistema',
    dateRange: { start, end },
    includeCharts: true,
    includeDetails: true,
    format: 'pdf',
    sections: {
      overview: true,
      api: true,
      cache: true,
      performance: true,
      alerts: true,
      errors: true
    }
  }
}

export async function generateReport(config: ReportConfig, data: ReportData): Promise<void> {
  const generator = new ReportGenerator(config, data)
  
  if (config.format === 'pdf') {
    await generator.generatePDF()
  } else {
    await generator.generateExcel()
  }
}
