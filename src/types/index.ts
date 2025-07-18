// User and Authentication Types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 'admin' | 'manager' | 'employee' | 'client'

export interface Session {
  user: User
  expires: string
}

// Project Management Types
export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  priority: Priority
  startDate: Date
  endDate?: Date
  budget?: number
  clientId: string
  managerId: string
  teamMembers: string[]
  progress: number
  createdAt: Date
  updatedAt: Date
  client?: Client
  manager?: User
  tasks?: Task[]
}

export type ProjectStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  assigneeId?: string
  projectId: string
  parentTaskId?: string
  estimatedHours?: number
  actualHours?: number
  startDate?: Date
  dueDate?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  assignee?: User
  project?: Project
  subtasks?: Task[]
  timeEntries?: TimeEntry[]
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

// CRM Types
export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  website?: string
  notes?: string
  status: ClientStatus
  source?: string
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  projects?: Project[]
  invoices?: Invoice[]
  leads?: Lead[]
}

export type ClientStatus = 'active' | 'inactive' | 'prospect'

export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: LeadStatus
  source?: string
  value?: number
  probability?: number
  expectedCloseDate?: Date
  assignedTo?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  activities?: Activity[]
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description?: string
  leadId?: string
  clientId?: string
  userId: string
  scheduledAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task'

// Invoicing Types
export interface Invoice {
  id: string
  number: string
  clientId: string
  projectId?: string
  status: InvoiceStatus
  issueDate: Date
  dueDate: Date
  paidDate?: Date
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  currency: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  client?: Client
  project?: Project
  items?: InvoiceItem[]
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface InvoiceItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// Time Tracking Types
export interface TimeEntry {
  id: string
  userId: string
  taskId?: string
  projectId?: string
  description?: string
  startTime: Date
  endTime?: Date
  duration?: number
  isRunning: boolean
  createdAt: Date
  updatedAt: Date
  user?: User
  task?: Task
  project?: Project
}

// Support System Types
export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: Priority
  category?: string
  clientId?: string
  assignedTo?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  client?: Client
  assignee?: User
  creator?: User
  comments?: TicketComment[]
  attachments?: Attachment[]
}

export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'

export interface TicketComment {
  id: string
  ticketId: string
  userId: string
  content: string
  isInternal: boolean
  createdAt: Date
  user?: User
}

export interface Attachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  ticketId?: string
  createdAt: Date
}

// Knowledge Base Types
export interface KnowledgeCategory {
  id: string
  name: string
  description?: string
  parentId?: string
  order: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  articles?: KnowledgeArticle[]
  subcategories?: KnowledgeCategory[]
}

export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  excerpt?: string
  categoryId: string
  authorId: string
  status: ArticleStatus
  isPublic: boolean
  views: number
  helpful: number
  notHelpful: number
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  category?: KnowledgeCategory
  author?: User
}

export type ArticleStatus = 'draft' | 'published' | 'archived'

// Dashboard Types
export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalClients: number
  totalRevenue: number
  openTickets: number
  pendingInvoices: number
  recentActivities: Activity[]
  projectProgress: ProjectProgress[]
  revenueChart: ChartData[]
}

export interface ProjectProgress {
  projectId: string
  projectName: string
  progress: number
  status: ProjectStatus
}

export interface ChartData {
  label: string
  value: number
  date?: Date
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form Types
export interface LoginForm {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
}

// Notification Types
export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  userId: string
  createdAt: Date
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error'
