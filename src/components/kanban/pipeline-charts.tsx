"use client"

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lead, KanbanColumn } from '@/types/kanban'
import { formatCurrency } from '@/lib/utils'

interface PipelineChartsProps {
  leads: Lead[]
  columns: KanbanColumn[]
  isVisible?: boolean
  onToggle?: () => void
}

export function PipelineCharts({ leads, columns, isVisible = false, onToggle }: PipelineChartsProps) {
  const chartData = useMemo(() => {
    // Conversion funnel data
    const funnelData = columns.map(column => {
      const stageLeads = leads.filter(lead => lead.status === column.columnId)
      const stageValue = stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)
      return {
        stage: column.title,
        count: stageLeads.length,
        value: stageValue,
        color: column.color,
        percentage: leads.length > 0 ? (stageLeads.length / leads.length) * 100 : 0
      }
    })

    // Time-based analysis
    const now = new Date()
    const periods = [
      { label: '7 dias', days: 7 },
      { label: '30 dias', days: 30 },
      { label: '90 dias', days: 90 }
    ]

    const timeAnalysis = periods.map(period => {
      const cutoff = new Date(now.getTime() - period.days * 24 * 60 * 60 * 1000)
      const periodLeads = leads.filter(lead => new Date(lead.createdAt) > cutoff)
      const periodValue = periodLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)
      const wonLeads = periodLeads.filter(lead => lead.status === 'WON')
      
      return {
        period: period.label,
        leads: periodLeads.length,
        value: periodValue,
        won: wonLeads.length,
        conversionRate: periodLeads.length > 0 ? (wonLeads.length / periodLeads.length) * 100 : 0
      }
    })

    // Value distribution
    const valueRanges = [
      { label: '< €1K', min: 0, max: 1000 },
      { label: '€1K - €5K', min: 1000, max: 5000 },
      { label: '€5K - €10K', min: 5000, max: 10000 },
      { label: '€10K - €25K', min: 10000, max: 25000 },
      { label: '> €25K', min: 25000, max: Infinity }
    ]

    const valueDistribution = valueRanges.map(range => {
      const rangeLeads = leads.filter(lead => {
        const value = lead.value || 0
        return value >= range.min && value < range.max
      })
      return {
        range: range.label,
        count: rangeLeads.length,
        percentage: leads.length > 0 ? (rangeLeads.length / leads.length) * 100 : 0
      }
    })

    return { funnelData, timeAnalysis, valueDistribution }
  }, [leads, columns])

  if (!isVisible) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          Análise Avançada do Pipeline
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.funnelData.map((stage, index) => (
                <motion.div
                  key={stage.stage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300">{stage.stage}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-100">{stage.count}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        {stage.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-6 bg-slate-700/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stage.percentage}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                      className={`h-full ${stage.color} rounded-full`}
                    />
                  </div>
                  {stage.value > 0 && (
                    <div className="text-xs text-slate-500 mt-1">
                      {formatCurrency(stage.value)}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time-based Performance */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Performance por Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.timeAnalysis.map((period, index) => (
                <motion.div
                  key={period.period}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-700/30 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-200">{period.period}</span>
                    <div className="flex items-center gap-1">
                      {period.conversionRate > 20 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span className="text-xs text-slate-400">
                        {period.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-slate-400">Leads</div>
                      <div className="text-slate-100 font-semibold">{period.leads}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Ganhos</div>
                      <div className="text-green-400 font-semibold">{period.won}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Valor</div>
                      <div className="text-slate-100 font-semibold">
                        {formatCurrency(period.value)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Value Distribution */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              Distribuição por Valor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.valueDistribution.map((range, index) => (
                <motion.div
                  key={range.range}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-slate-300">{range.range}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-700/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${range.percentage}%` }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.6 }}
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-100 w-8">
                      {range.count}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Heatmap */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Last 7 days activity */}
              <div className="grid grid-cols-7 gap-1">
                {[...Array(7)].map((_, i) => {
                  const date = new Date()
                  date.setDate(date.getDate() - (6 - i))
                  const dayLeads = leads.filter(lead => {
                    const leadDate = new Date(lead.createdAt)
                    return leadDate.toDateString() === date.toDateString()
                  })
                  const intensity = Math.min(dayLeads.length / 3, 1) // Max 3 leads for full intensity
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`h-8 rounded text-xs flex items-center justify-center text-white font-medium ${
                        intensity > 0.7 ? 'bg-green-500' :
                        intensity > 0.4 ? 'bg-yellow-500' :
                        intensity > 0 ? 'bg-blue-500' : 'bg-slate-700/30'
                      }`}
                      title={`${date.toLocaleDateString()}: ${dayLeads.length} leads`}
                    >
                      {dayLeads.length}
                    </motion.div>
                  )
                })}
              </div>
              <div className="text-xs text-slate-400 text-center">
                Últimos 7 dias (leads criados por dia)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
