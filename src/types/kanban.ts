export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  source?: string
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'
  value?: number
  probability?: number
  expectedCloseDate?: string
  assignedTo?: string
  assignee?: {
    id: string
    name: string
    email: string
    avatar?: string | null
  }
  notes?: string
  createdAt: string
  updatedAt: string
  tags?: string[]
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  lastContactDate?: string
  nextFollowUpDate?: string
}

export interface KanbanColumn {
  id: string
  columnId: string
  title: string
  color: string
  order: number
  isVisible: boolean
  boardType: string
  count?: number
  wip_limit?: number
  description?: string
}

export interface KanbanFilter {
  assignedTo?: string[]
  source?: string[]
  priority?: string[]
  valueRange?: {
    min: number
    max: number
  }
  probabilityRange?: {
    min: number
    max: number
  }
  dateRange?: {
    start: string
    end: string
  }
  tags?: string[]
}

export interface KanbanMetrics {
  totalLeads: number
  totalValue: number
  averageProbability: number
  conversionRate: number
  averageTimeInStage: number
  wonDeals: number
  lostDeals: number
  pipelineVelocity: number
}

export interface KanbanActivity {
  id: string
  leadId: string
  userId: string
  action: 'created' | 'moved' | 'updated' | 'commented' | 'assigned'
  fromStatus?: string
  toStatus?: string
  description: string
  createdAt: string
}

export interface KanbanComment {
  id: string
  leadId: string
  userId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface KanbanAutomation {
  id: string
  name: string
  trigger: {
    type: 'status_change' | 'time_based' | 'value_change'
    conditions: Record<string, any>
  }
  actions: {
    type: 'move_to_status' | 'assign_user' | 'send_email' | 'create_task'
    parameters: Record<string, any>
  }[]
  isActive: boolean
  createdAt: string
}

export interface KanbanView {
  id: string
  name: string
  filters: KanbanFilter
  sortBy: string
  sortOrder: 'asc' | 'desc'
  isDefault: boolean
  userId: string
  createdAt: string
}
