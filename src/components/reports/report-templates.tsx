"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Shield, 
  Activity,
  BarChart3
} from "lucide-react"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  color: string
  dateRange: {
    start: Date
    end: Date
  }
  sections: {
    overview: boolean
    api: boolean
    cache: boolean
    performance: boolean
    alerts: boolean
    errors: boolean
  }
  estimatedSize: string
  estimatedTime: string
}

interface ReportTemplatesProps {
  onSelectTemplate: (template: ReportTemplate) => void
  loading?: boolean
}

export function ReportTemplates({ onSelectTemplate, loading = false }: ReportTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const templates: ReportTemplate[] = [
    {
      id: 'daily',
      name: 'Relatório Diário',
      description: 'Resumo das últimas 24 horas com métricas essenciais',
      icon: Clock,
      color: 'bg-blue-500',
      dateRange: {
        start: subDays(new Date(), 1),
        end: new Date()
      },
      sections: {
        overview: true,
        api: true,
        cache: true,
        performance: false,
        alerts: true,
        errors: true
      },
      estimatedSize: '2-3 MB',
      estimatedTime: '30 segundos'
    },
    {
      id: 'weekly',
      name: 'Relatório Semanal',
      description: 'Análise completa dos últimos 7 dias',
      icon: Calendar,
      color: 'bg-green-500',
      dateRange: {
        start: subDays(new Date(), 7),
        end: new Date()
      },
      sections: {
        overview: true,
        api: true,
        cache: true,
        performance: true,
        alerts: true,
        errors: true
      },
      estimatedSize: '5-8 MB',
      estimatedTime: '1-2 minutos'
    },
    {
      id: 'monthly',
      name: 'Relatório Mensal',
      description: 'Visão geral dos últimos 30 dias',
      icon: BarChart3,
      color: 'bg-purple-500',
      dateRange: {
        start: subDays(new Date(), 30),
        end: new Date()
      },
      sections: {
        overview: true,
        api: true,
        cache: true,
        performance: true,
        alerts: true,
        errors: false
      },
      estimatedSize: '10-15 MB',
      estimatedTime: '2-3 minutos'
    },
    {
      id: 'performance',
      name: 'Relatório de Performance',
      description: 'Foco em métricas de performance e otimização',
      icon: TrendingUp,
      color: 'bg-orange-500',
      dateRange: {
        start: subDays(new Date(), 7),
        end: new Date()
      },
      sections: {
        overview: true,
        api: true,
        cache: true,
        performance: true,
        alerts: false,
        errors: false
      },
      estimatedSize: '3-5 MB',
      estimatedTime: '45 segundos'
    },
    {
      id: 'security',
      name: 'Relatório de Segurança',
      description: 'Análise de alertas, erros e incidentes de segurança',
      icon: Shield,
      color: 'bg-red-500',
      dateRange: {
        start: subDays(new Date(), 7),
        end: new Date()
      },
      sections: {
        overview: true,
        api: false,
        cache: false,
        performance: false,
        alerts: true,
        errors: true
      },
      estimatedSize: '1-2 MB',
      estimatedTime: '20 segundos'
    },
    {
      id: 'executive',
      name: 'Relatório Executivo',
      description: 'Resumo executivo com KPIs principais',
      icon: Activity,
      color: 'bg-indigo-500',
      dateRange: {
        start: subDays(new Date(), 30),
        end: new Date()
      },
      sections: {
        overview: true,
        api: true,
        cache: false,
        performance: false,
        alerts: true,
        errors: false
      },
      estimatedSize: '2-3 MB',
      estimatedTime: '30 segundos'
    }
  ]

  const handleSelectTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template.id)
    onSelectTemplate(template)
  }

  const getSectionBadges = (sections: ReportTemplate['sections']) => {
    const activeSections = Object.entries(sections)
      .filter(([_, active]) => active)
      .map(([section, _]) => section)

    const sectionNames: Record<string, string> = {
      overview: 'Resumo',
      api: 'APIs',
      cache: 'Cache',
      performance: 'Performance',
      alerts: 'Alertas',
      errors: 'Erros'
    }

    return activeSections.map(section => (
      <Badge key={section} variant="secondary" className="text-xs">
        {sectionNames[section]}
      </Badge>
    ))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Templates de Relatórios</h3>
        <p className="text-slate-400 text-sm">
          Escolha um template pré-configurado ou personalize seu próprio relatório
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const Icon = template.icon
          const isSelected = selectedTemplate === template.id

          return (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-slate-800/80' 
                  : 'hover:bg-slate-800/50'
              }`}
              onClick={() => handleSelectTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${template.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-white">
                      {template.name}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="text-sm text-slate-300">
                  {template.description}
                </CardDescription>

                <div className="space-y-2">
                  <div className="text-xs text-slate-400">
                    <span className="font-medium">Período:</span>{' '}
                    {format(template.dateRange.start, 'dd/MM', { locale: ptBR })} -{' '}
                    {format(template.dateRange.end, 'dd/MM', { locale: ptBR })}
                  </div>
                  
                  <div className="text-xs text-slate-400">
                    <span className="font-medium">Tamanho estimado:</span> {template.estimatedSize}
                  </div>
                  
                  <div className="text-xs text-slate-400">
                    <span className="font-medium">Tempo de geração:</span> {template.estimatedTime}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-300">Seções incluídas:</div>
                  <div className="flex flex-wrap gap-1">
                    {getSectionBadges(template.sections)}
                  </div>
                </div>

                <Button
                  variant={isSelected ? "primary" : "outline"}
                  size="sm"
                  className="w-full"
                  disabled={loading}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectTemplate(template)
                  }}
                >
                  {isSelected ? (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Selecionado
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Selecionar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedTemplate && (
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-400">
              <FileText className="w-5 h-5" />
              <span className="font-medium">
                Template &quot;{templates.find(t => t.id === selectedTemplate)?.name}&quot; selecionado
              </span>
            </div>
            <p className="text-slate-300 text-sm mt-2">
              Configure as opções adicionais abaixo e clique em &quot;Gerar Relatório&quot; para continuar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
