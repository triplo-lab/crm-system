// Centralized database types to ensure consistency
// Since the current schema uses String fields instead of enums, we define the types manually

// User types
export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

// Task types
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

// Project types
export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'

// Lead types
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST'

// Client types
export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT'

// Proposal types
export type ProposalStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

// Priority types
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// Activity types
export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE'

// Ticket types
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

// Invoice types
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'

// Article types
export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

// Notification types
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'

// Constants for easy access
export const USER_ROLES = {
  ADMIN: 'ADMIN' as UserRole,
  MANAGER: 'MANAGER' as UserRole,
  EMPLOYEE: 'EMPLOYEE' as UserRole,
} as const

export const TASK_STATUSES = {
  TODO: 'TODO' as TaskStatus,
  IN_PROGRESS: 'IN_PROGRESS' as TaskStatus,
  COMPLETED: 'COMPLETED' as TaskStatus,
  CANCELLED: 'CANCELLED' as TaskStatus,
} as const

export const LEAD_STATUSES = {
  NEW: 'NEW' as LeadStatus,
  CONTACTED: 'CONTACTED' as LeadStatus,
  QUALIFIED: 'QUALIFIED' as LeadStatus,
  PROPOSAL: 'PROPOSAL' as LeadStatus,
  NEGOTIATION: 'NEGOTIATION' as LeadStatus,
  CLOSED_WON: 'CLOSED_WON' as LeadStatus,
  CLOSED_LOST: 'CLOSED_LOST' as LeadStatus,
} as const

export const PROJECT_STATUSES = {
  NOT_STARTED: 'NOT_STARTED' as ProjectStatus,
  IN_PROGRESS: 'IN_PROGRESS' as ProjectStatus,
  ON_HOLD: 'ON_HOLD' as ProjectStatus,
  COMPLETED: 'COMPLETED' as ProjectStatus,
  CANCELLED: 'CANCELLED' as ProjectStatus,
} as const

export const PROPOSAL_STATUSES = {
  DRAFT: 'DRAFT' as ProposalStatus,
  SENT: 'SENT' as ProposalStatus,
  VIEWED: 'VIEWED' as ProposalStatus,
  ACCEPTED: 'ACCEPTED' as ProposalStatus,
  REJECTED: 'REJECTED' as ProposalStatus,
  EXPIRED: 'EXPIRED' as ProposalStatus,
} as const

// Helper functions for type checking
export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(USER_ROLES).includes(role as UserRole)
}

export const isValidTaskStatus = (status: string): status is TaskStatus => {
  return Object.values(TASK_STATUSES).includes(status as TaskStatus)
}

export const isValidLeadStatus = (status: string): status is LeadStatus => {
  return Object.values(LEAD_STATUSES).includes(status as LeadStatus)
}

export const isValidProjectStatus = (status: string): status is ProjectStatus => {
  return Object.values(PROJECT_STATUSES).includes(status as ProjectStatus)
}

export const isValidProposalStatus = (status: string): status is ProposalStatus => {
  return Object.values(PROPOSAL_STATUSES).includes(status as ProposalStatus)
}
