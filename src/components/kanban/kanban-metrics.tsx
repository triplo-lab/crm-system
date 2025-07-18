"use client"

import { useMemo, memo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Users,
  Target,
  Clock,
  Award,
  AlertTriangle,
  BarChart3,
  PieChart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lead, KanbanColumn } from '@/types/kanban'
import { formatCurrency } from '@/lib/utils'

interface KanbanMetricsProps {
  leads: Lead[]
  columns: KanbanColumn[]
  isVisible?: boolean
}

export const KanbanMetrics = memo(function KanbanMetrics({ leads, columns, isVisible = true }: KanbanMetricsProps) {
  const metrics = useMemo(() => {
    const totalLeads = leads.length
    const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0)
    const averageProbability = totalLeads > 0 
      ? leads.reduce((sum, lead) => sum + (lead.probability || 0), 0) / totalLeads 
      : 0

    // Conversion metrics
    const wonLeads = leads.filter(lead => lead.status === 'WON')
    const lostLeads = leads.filter(lead => lead.status === 'LOST')
    const activeLeads = leads.filter(lead => !['WON', 'LOST'].includes(lead.status))
    
    const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0
    const wonValue = wonLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)
    const activeValue = activeLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)

    // Time-based metrics
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentLeads = leads.filter(lead => new Date(lead.createdAt) > thirtyDaysAgo)
    
    // Stage distribution
    const stageDistribution = columns.map(column => ({
      stage: column.title,
      count: leads.filter(lead => lead.status === column.columnId).length,
      value: leads.filter(lead => lead.status === column.columnId)
                 .reduce((sum, lead) => sum + (lead.value || 0), 0),
      color: column.color
    }))

    // High-value leads (>10k)
    const highValueLeads = leads.filter(lead => (lead.value || 0) > 10000)
    
    // Stale leads (>30 days without update)
    const staleLeads = leads.filter(lead => {
      const lastUpdate = new Date(lead.updatedAt)
      const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceUpdate > 30 && !['WON', 'LOST'].includes(lead.status)
    })

    return {
      totalLeads,
      totalValue,
      averageProbability,
      conversionRate,
      wonValue,
      activeValue,
      recentLeads: recentLeads.length,
      stageDistribution,
      highValueLeads: highValueLeads.length,
      staleLeads: staleLeads.length,
      wonLeads: wonLeads.length,
      lostLeads: lostLeads.length,
      activeLeads: activeLeads.length
    }
  }, [leads, columns])

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
    >
      {/* Total Pipeline Value */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Euro className="w-4 h-4 text-blue-400" />
            Valor Total Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-100 mb-1">
            {formatCurrency(metrics.totalValue)}
          </div>
          <div className="text-xs text-slate-400">
            Ativo: {formatCurrency(metrics.activeValue)}
          </div>
          <div className="text-xs text-green-400">
            Ganho: {formatCurrency(metrics.wonValue)}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-400" />
            Taxa de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-100 mb-1">
            {metrics.conversionRate.toFixed(1)}%
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-400">{metrics.wonLeads} ganhos</span>
            <span className="text-slate-400">•</span>
            <span className="text-red-400">{metrics.lostLeads} perdidos</span>
          </div>
          <div className="text-xs text-slate-400">
            {metrics.activeLeads} ativos
          </div>
        </CardContent>
      </Card>

      {/* Average Probability */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            Probabilidade Média
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-100 mb-1">
            {metrics.averageProbability.toFixed(0)}%
          </div>
          <div className="flex items-center gap-1 text-xs">
            {metrics.averageProbability > 50 ? (
              <TrendingUp className="w-3 h-3 text-green-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
            <span className="text-slate-400">
              {metrics.averageProbability > 50 ? 'Tendência positiva' : 'Precisa atenção'}
            </span>
          </div>
          {metrics.highValueLeads > 0 && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {metrics.highValueLeads} high-value
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Activity & Alerts */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            Atividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-100 mb-1">
            {metrics.recentLeads}
          </div>
          <div className="text-xs text-slate-400 mb-2">
            Novos leads (30 dias)
          </div>
          {metrics.staleLeads > 0 && (
            <div className="flex items-center gap-1 text-xs text-orange-400">
              <AlertTriangle className="w-3 h-3" />
              {metrics.staleLeads} leads parados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stage Distribution */}
      <Card className="md:col-span-2 lg:col-span-4 bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-slate-400" />
            Distribuição por Etapa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {metrics.stageDistribution.map((stage, index) => (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`w-full h-2 rounded-full ${stage.color} mb-2`} />
                <div className="text-sm font-semibold text-slate-100">
                  {stage.count}
                </div>
                <div className="text-xs text-slate-400 mb-1">
                  {stage.stage}
                </div>
                {stage.value > 0 && (
                  <div className="text-xs text-slate-500">
                    {formatCurrency(stage.value)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})
