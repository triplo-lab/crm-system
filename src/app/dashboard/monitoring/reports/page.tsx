"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportTemplates } from "@/components/reports/report-templates"
import { ReportGenerator } from "@/components/reports/report-generator"
import {
  FileText,
  Layers,
  Settings,
  Download,
  BarChart3,
  Clock,
  Calendar
} from "lucide-react"

export default function ReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'templates' | 'custom'>('templates')

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template)
    setActiveTab('custom')
  }

  const resetSelection = () => {
    setSelectedTemplate(null)
    setActiveTab('templates')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Relatórios de Monitorização</h1>
            <p className="text-slate-400 mt-1">
              Gere relatórios detalhados das métricas de performance do sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedTemplate && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetSelection}
              >
                <Layers className="w-4 h-4 mr-2" />
                Voltar aos Templates
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-2 bg-blue-500/20 rounded-lg mr-4">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">PDF & Excel</div>
                <div className="text-sm text-slate-400">Formatos Disponíveis</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-2 bg-green-500/20 rounded-lg mr-4">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">30s - 3min</div>
                <div className="text-sm text-slate-400">Tempo de Geração</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-2 bg-purple-500/20 rounded-lg mr-4">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">1-30 dias</div>
                <div className="text-sm text-slate-400">Período Configurável</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'templates' | 'custom')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Templates Pré-configurados
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Relatório Personalizado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Templates Pré-configurados
                </CardTitle>
                <CardDescription>
                  Escolha um template otimizado para diferentes necessidades de relatório
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportTemplates onSelectTemplate={handleTemplateSelect} />
              </CardContent>
            </Card>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recursos dos Relatórios</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Métricas de performance em tempo real
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Análise detalhada de APIs e cache
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      Histórico de alertas e incidentes
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      Gráficos e visualizações profissionais
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      Exportação em PDF e Excel
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tipos de Relatório</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <div className="font-medium text-white">Relatórios Operacionais</div>
                      <div className="text-sm text-slate-400">Diários e semanais para monitorização contínua</div>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <div className="font-medium text-white">Relatórios Executivos</div>
                      <div className="text-sm text-slate-400">Resumos mensais para gestão</div>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <div className="font-medium text-white">Relatórios Técnicos</div>
                      <div className="text-sm text-slate-400">Análises detalhadas de performance</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <ReportGenerator initialTemplate={selectedTemplate} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
