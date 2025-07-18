import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  if (!date) return 'Data inválida'

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida'
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj)
}

export function formatDateTime(date: Date | string): string {
  if (!date) return 'Data inválida'

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida'
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Project statuses
    'not_started': 'bg-gray-500',
    'in_progress': 'bg-blue-500',
    'on_hold': 'bg-yellow-500',
    'completed': 'bg-green-500',
    'cancelled': 'bg-red-500',
    
    // Lead statuses
    'new': 'bg-blue-500',
    'contacted': 'bg-yellow-500',
    'qualified': 'bg-purple-500',
    'proposal': 'bg-orange-500',
    'negotiation': 'bg-indigo-500',
    'won': 'bg-green-500',
    'lost': 'bg-red-500',
    
    // Ticket statuses
    'open': 'bg-red-500',
    'pending': 'bg-yellow-500',
    'resolved': 'bg-green-500',
    'closed': 'bg-gray-500',
    
    // Invoice statuses
    'draft': 'bg-gray-500',
    'sent': 'bg-blue-500',
    'paid': 'bg-green-500',
    'overdue': 'bg-red-500',
  }
  
  return statusColors[status.toLowerCase()] || 'bg-gray-500'
}

export function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    'low': 'bg-green-500',
    'medium': 'bg-yellow-500',
    'high': 'bg-orange-500',
    'urgent': 'bg-red-500',
  }
  
  return priorityColors[priority.toLowerCase()] || 'bg-gray-500'
}
