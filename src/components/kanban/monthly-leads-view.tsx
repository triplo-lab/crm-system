"use client"

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  Users,
  Euro
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lead } from '@/types/kanban'
import { formatCurrency, formatDate } from '@/lib/utils'

interface MonthlyLeadsViewProps {
  leads: Lead[]
  columnTitle: string
  columnColor: string
  isVisible: boolean
  onClose: () => void
}

export function MonthlyLeadsView({ 
  leads, 
  columnTitle, 
  columnColor, 
  isVisible, 
  onClose 
}: MonthlyLeadsViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Group leads by month
  const monthlyData = useMemo(() => {
    const grouped: Record<string, Lead[]> = {}
    
    leads.forEach(lead => {
      const date = new Date(lead.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      grouped[monthKey].push(lead)
    })

    return grouped
  }, [leads])

  // Get current month data
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  const currentMonthLeads = monthlyData[currentMonthKey] || []

  // Calculate metrics for current month
  const monthMetrics = useMemo(() => {
    const totalValue = currentMonthLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)
    const avgValue = currentMonthLeads.length > 0 ? totalValue / currentMonthLeads.length : 0
    const avgProbability = currentMonthLeads.length > 0 
      ? currentMonthLeads.reduce((sum, lead) => sum + (lead.probability || 0), 0) / currentMonthLeads.length 
      : 0

    return {
      count: currentMonthLeads.length,
      totalValue,
      avgValue,
      avgProbability
    }
  }, [currentMonthLeads])

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  // Get month name
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('pt-PT', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  // Group leads by week within the month
  const weeklyData = useMemo(() => {
    const weeks: Record<number, Lead[]> = {}
    
    currentMonthLeads.forEach(lead => {
      const date = new Date(lead.createdAt)
      const weekNumber = Math.ceil(date.getDate() / 7)
      
      if (!weeks[weekNumber]) {
        weeks[weekNumber] = []
      }
      weeks[weekNumber].push(lead)
    })

    return weeks
  }, [currentMonthLeads])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 w-full max-w-2xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${columnColor}`} />
              <h2 className="text-lg font-semibold text-slate-100">
                {columnTitle} - Vista Mensal
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="gap-1 h-8 px-2"
            >
              <ChevronLeft className="w-3 h-3" />
              <span className="text-xs">Anterior</span>
            </Button>

            <h3 className="text-base font-semibold text-slate-100 capitalize">
              {getMonthName(currentDate)}
            </h3>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="gap-1 h-8 px-2"
            >
              <span className="text-xs">Próximo</span>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>

          {/* Month Metrics */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-3 h-3 text-blue-400" />
                  <span className="text-xs text-slate-400">Total de Leads</span>
                </div>
                <div className="text-xl font-bold text-slate-100">
                  {monthMetrics.count}
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Euro className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-slate-400">Valor Total</span>
                </div>
                <div className="text-xl font-bold text-slate-100">
                  {formatCurrency(monthMetrics.totalValue)}
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-slate-400">Valor Médio</span>
                </div>
                <div className="text-xl font-bold text-slate-100">
                  {formatCurrency(monthMetrics.avgValue)}
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-slate-400">Prob. Média</span>
                </div>
                <div className="text-xl font-bold text-slate-100">
                  {monthMetrics.avgProbability.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Breakdown */}
          <div className="p-3 max-h-80 overflow-y-auto">
            {Object.keys(weeklyData).length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum lead neste mês</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(weeklyData).map(([week, weekLeads]) => (
                  <div key={week} className="bg-slate-700/20 border border-slate-600/50 rounded-lg">
                    <div className="p-2 border-b border-slate-600/30">
                      <h4 className="text-xs font-medium text-slate-300">
                        Semana {week} ({weekLeads.length} leads)
                      </h4>
                    </div>
                    <div className="p-2">
                      <div className="space-y-2">
                        {weekLeads.map((lead) => (
                          <motion.div
                            key={lead.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-2 bg-slate-800/30 rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${columnColor}`} />
                              <div>
                                <div className="text-xs font-medium text-slate-200">
                                  {lead.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {formatDate(lead.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {lead.value && (
                                <Badge variant="secondary" className="text-xs px-1 py-0 h-5">
                                  {formatCurrency(lead.value)}
                                </Badge>
                              )}
                              {lead.probability && (
                                <Badge variant="outline" className="text-xs px-1 py-0 h-5">
                                  {lead.probability}%
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
