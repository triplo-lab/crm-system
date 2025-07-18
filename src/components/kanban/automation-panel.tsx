"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Plus,
  Settings,
  Play,
  Pause,
  Trash2,
  ArrowRight,
  Clock,
  Mail,
  User,
  Target,
  X,
  Save
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { KanbanAutomation } from '@/types/kanban'

interface AutomationPanelProps {
  automations: KanbanAutomation[]
  onCreateAutomation?: (automation: Omit<KanbanAutomation, 'id' | 'createdAt'>) => void
  onToggleAutomation?: (id: string, isActive: boolean) => void
  onDeleteAutomation?: (id: string) => void
  isVisible?: boolean
  onToggle?: () => void
}

export function AutomationPanel({
  automations,
  onCreateAutomation,
  onToggleAutomation,
  onDeleteAutomation,
  isVisible = false,
  onToggle
}: AutomationPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    trigger: {
      type: 'status_change' as const,
      conditions: {}
    },
    actions: [{
      type: 'move_to_status' as const,
      parameters: {}
    }],
    isActive: true
  })

  const triggerTypes = [
    { value: 'status_change', label: 'Mudança de Status', icon: ArrowRight },
    { value: 'time_based', label: 'Baseado em Tempo', icon: Clock },
    { value: 'value_change', label: 'Mudança de Valor', icon: Target }
  ]

  const actionTypes = [
    { value: 'move_to_status', label: 'Mover para Status', icon: ArrowRight },
    { value: 'assign_user', label: 'Atribuir Utilizador', icon: User },
    { value: 'send_email', label: 'Enviar Email', icon: Mail },
    { value: 'create_task', label: 'Criar Tarefa', icon: Plus }
  ]

  const handleCreateAutomation = () => {
    if (!newAutomation.name.trim() || !onCreateAutomation) return

    onCreateAutomation(newAutomation)
    setNewAutomation({
      name: '',
      trigger: { type: 'status_change', conditions: {} },
      actions: [{ type: 'move_to_status', parameters: {} }],
      isActive: true
    })
    setShowCreateForm(false)
  }

  const getAutomationIcon = (triggerType: string) => {
    const trigger = triggerTypes.find(t => t.value === triggerType)
    return trigger ? trigger.icon : Zap
  }

  const getActionIcon = (actionType: string) => {
    const action = actionTypes.find(a => a.value === actionType)
    return action ? action.icon : Settings
  }

  if (!isVisible) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Automações e Workflows
        </h3>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Automação
        </Button>
      </div>

      {/* Create Automation Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-300">
                  Criar Nova Automação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-2 block">
                    Nome da Automação
                  </label>
                  <Input
                    value={newAutomation.name}
                    onChange={(e) => setNewAutomation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Mover leads antigos para perdidos"
                    className="h-8"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-2 block">
                      Trigger (Quando)
                    </label>
                    <div className="space-y-2">
                      {triggerTypes.map(trigger => {
                        const Icon = trigger.icon
                        return (
                          <Button
                            key={trigger.value}
                            variant={newAutomation.trigger.type === trigger.value ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setNewAutomation(prev => ({
                              ...prev,
                              trigger: { type: trigger.value as any, conditions: {} }
                            }))}
                            className="w-full justify-start gap-2 h-8"
                          >
                            <Icon className="w-3 h-3" />
                            {trigger.label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-2 block">
                      Ação (O que fazer)
                    </label>
                    <div className="space-y-2">
                      {actionTypes.map(action => {
                        const Icon = action.icon
                        return (
                          <Button
                            key={action.value}
                            variant={newAutomation.actions[0]?.type === action.value ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setNewAutomation(prev => ({
                              ...prev,
                              actions: [{ type: action.value as any, parameters: {} }]
                            }))}
                            className="w-full justify-start gap-2 h-8"
                          >
                            <Icon className="w-3 h-3" />
                            {action.label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateAutomation}
                    disabled={!newAutomation.name.trim()}
                    className="gap-2"
                  >
                    <Save className="w-3 h-3" />
                    Criar Automação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Automations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence>
          {automations.map((automation, index) => {
            const TriggerIcon = getAutomationIcon(automation.trigger.type)
            const ActionIcon = getActionIcon(automation.actions[0]?.type || 'move_to_status')

            return (
              <motion.div
                key={automation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`bg-slate-800/50 border-slate-700/50 ${
                  automation.isActive ? 'ring-1 ring-green-500/20' : 'opacity-60'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
                        <TriggerIcon className="w-4 h-4 text-yellow-400" />
                        {automation.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={automation.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {automation.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleAutomation?.(automation.id, !automation.isActive)}
                          className="h-6 w-6 p-0"
                        >
                          {automation.isActive ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteAutomation?.(automation.id)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Trigger */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Quando:</span>
                        <Badge variant="outline" className="text-xs">
                          {triggerTypes.find(t => t.value === automation.trigger.type)?.label}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <span className="text-slate-400 text-sm">Então:</span>
                        {automation.actions.map((action, actionIndex) => (
                          <div key={actionIndex} className="flex items-center gap-2 text-sm">
                            <ActionIcon className="w-3 h-3 text-blue-400" />
                            <span className="text-slate-300">
                              {actionTypes.find(a => a.value === action.type)?.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Created date */}
                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                        Criado em {new Date(automation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {automations.length === 0 && (
          <div className="lg:col-span-2 text-center py-8 text-slate-400">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma automação configurada</p>
            <p className="text-xs mt-1">Crie automações para otimizar o seu workflow</p>
          </div>
        )}
      </div>

      {/* Quick Templates */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-300">
            Templates Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                name: 'Leads Antigos',
                description: 'Mover leads sem atividade há 30 dias para "Perdidos"',
                trigger: 'time_based',
                action: 'move_to_status'
              },
              {
                name: 'Alto Valor',
                description: 'Atribuir leads >€10k ao gestor sénior',
                trigger: 'value_change',
                action: 'assign_user'
              },
              {
                name: 'Follow-up',
                description: 'Enviar email de follow-up após 3 dias',
                trigger: 'time_based',
                action: 'send_email'
              }
            ].map((template, index) => (
              <motion.div
                key={template.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="outline"
                  className="w-full h-auto p-3 text-left"
                  onClick={() => {
                    setNewAutomation({
                      name: template.name,
                      trigger: { type: template.trigger as any, conditions: {} },
                      actions: [{ type: template.action as any, parameters: {} }],
                      isActive: true
                    })
                    setShowCreateForm(true)
                  }}
                >
                  <div>
                    <div className="font-medium text-sm text-slate-200 mb-1">
                      {template.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {template.description}
                    </div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
