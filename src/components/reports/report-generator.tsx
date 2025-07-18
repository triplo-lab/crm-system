"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
// Select component replaced with native select for simplicity
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  FileText, 
  Calendar as CalendarIcon, 
  Settings, 
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ReportConfig, ReportData, generateReport, createDefaultReportConfig } from "@/lib/reports"
import { toast } from "sonner"

interface ReportGeneratorProps {
  initialTemplate?: any
}

export function ReportGenerator({ initialTemplate }: ReportGeneratorProps) {
  const [config, setConfig] = useState<ReportConfig>(() => {
    if (initialTemplate) {
      return {
        title: `Relatório de Monitorização - ${initialTemplate.name}`,
        dateRange: initialTemplate.dateRange,
        includeCharts: true,
        includeDetails: true,
        format: 'pdf',
        sections: initialTemplate.sections
      }
    }
    return createDefaultReportConfig()
  })

  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [step, setStep] = useState<'config' | 'generating' | 'ready'>('config')

  const handleDateChange = (field: 'start' | 'end', date: Date | undefined) => {
    if (date) {
      setConfig(prev => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [field]: date
        }
      }))
    }
  }

  const handleSectionToggle = (section: keyof ReportConfig['sections']) => {
    setConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: !prev.sections[section]
      }
    }))
  }

  const generateReportData = async () => {
    setLoading(true)
    setStep('generating')

    try {
      const response = await fetch('/api/monitoring/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange: config.dateRange,
          sections: config.sections,
          format: config.format,
          title: config.title
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao gerar dados do relatório')
      }

      const result = await response.json()
      setReportData(result.data)
      setStep('ready')
      toast.success('Dados do relatório coletados com sucesso!')

    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Erro ao gerar relatório')
      setStep('config')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async () => {
    if (!reportData) return

    setLoading(true)
    try {
      await generateReport(config, reportData)
      toast.success(`Relatório ${config.format.toUpperCase()} baixado com sucesso!`)
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Erro ao baixar relatório')
    } finally {
      setLoading(false)
    }
  }

  const getActiveSectionsCount = () => {
    return Object.values(config.sections).filter(Boolean).length
  }

  const getEstimatedSize = () => {
    const sectionsCount = getActiveSectionsCount()
    const days = Math.ceil((config.dateRange.end.getTime() - config.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
    
    if (config.format === 'pdf') {
      return `${Math.max(1, sectionsCount * days * 0.5).toFixed(1)} MB`
    } else {
      return `${Math.max(0.5, sectionsCount * days * 0.2).toFixed(1)} MB`
    }
  }

  if (step === 'generating') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Gerando Relatório</h3>
          <p className="text-slate-400 text-center">
            Coletando dados de monitorização e preparando o relatório...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (step === 'ready') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            Relatório Pronto
          </CardTitle>
          <CardDescription>
            Os dados foram coletados e o relatório está pronto para download
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800 rounded-lg">
            <div>
              <div className="text-sm text-slate-400">Período</div>
              <div className="font-medium text-white">
                {format(config.dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} - {format(config.dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Formato</div>
              <div className="font-medium text-white uppercase">{config.format}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Seções</div>
              <div className="font-medium text-white">{getActiveSectionsCount()} seções</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Tamanho Estimado</div>
              <div className="font-medium text-white">{getEstimatedSize()}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={downloadReport}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Baixar Relatório
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep('config')}
            >
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuração do Relatório
          </CardTitle>
          <CardDescription>
            Configure as opções do seu relatório personalizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Relatório</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título do relatório"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Formato</Label>
                <select
                  value={config.format}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, format: e.target.value as 'pdf' | 'excel' }))
                  }
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm ring-offset-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
              </div>

              <div>
                <Label>Tamanho Estimado</Label>
                <div className="h-10 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md flex items-center">
                  <span className="text-sm text-slate-300">{getEstimatedSize()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <Label>Período do Relatório</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-400">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !config.dateRange.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.dateRange.start ? (
                        format(config.dateRange.start, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={config.dateRange.start}
                      onSelect={(date) => handleDateChange('start', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-sm text-slate-400">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !config.dateRange.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.dateRange.end ? (
                        format(config.dateRange.end, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={config.dateRange.end}
                      onSelect={(date) => handleDateChange('end', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            <Label>Seções do Relatório</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(config.sections).map(([section, enabled]) => {
                const sectionNames: Record<string, string> = {
                  overview: 'Resumo Geral',
                  api: 'Performance das APIs',
                  cache: 'Performance do Cache',
                  performance: 'Métricas de Performance',
                  alerts: 'Alertas do Sistema',
                  errors: 'Erros e Incidentes'
                }

                return (
                  <div key={section} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <Label htmlFor={section} className="text-sm font-medium">
                      {sectionNames[section]}
                    </Label>
                    <Switch
                      id={section}
                      checked={enabled}
                      onCheckedChange={() => handleSectionToggle(section as keyof ReportConfig['sections'])}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <Label>Opções Adicionais</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <Label htmlFor="includeCharts" className="text-sm font-medium">
                  Incluir Gráficos
                </Label>
                <Switch
                  id="includeCharts"
                  checked={config.includeCharts}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeCharts: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <Label htmlFor="includeDetails" className="text-sm font-medium">
                  Incluir Detalhes Técnicos
                </Label>
                <Switch
                  id="includeDetails"
                  checked={config.includeDetails}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeDetails: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-4">
            {getActiveSectionsCount() === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 text-sm">
                  Selecione pelo menos uma seção para gerar o relatório
                </span>
              </div>
            ) : (
              <Button
                onClick={generateReportData}
                disabled={loading || getActiveSectionsCount() === 0}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Gerar Relatório
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
