'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface ActivityLogData {
  action: string
  entityType: string
  entityId?: string
  entityName?: string
  description?: string
  metadata?: Record<string, any>
}

interface PageVisit {
  page: string
  startTime: number
  endTime?: number
  duration?: number
}

class ActivityLogger {
  private static instance: ActivityLogger
  private currentPageVisit: PageVisit | null = null
  private sessionId: string
  private userId: string | null = null
  private userName: string | null = null

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger()
    }
    return ActivityLogger.instance
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  setUser(userId: string | null, userName: string | null) {
    this.userId = userId
    this.userName = userName
  }

  async logActivity(data: ActivityLogData) {
    try {
      if (!this.userId) return // Only log for authenticated users

      await fetch('/api/system-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId || 'unknown',
          entityName: data.entityName || data.entityType,
          description: data.description || `${data.action} ${data.entityType}`,
          metadata: {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...data.metadata
          }
        })
      })
    } catch (error) {
      console.warn('Failed to log activity:', error)
    }
  }

  logPageVisit(page: string) {
    // End previous page visit
    if (this.currentPageVisit) {
      this.currentPageVisit.endTime = Date.now()
      this.currentPageVisit.duration = this.currentPageVisit.endTime - this.currentPageVisit.startTime

      // Log the page visit
      this.logActivity({
        action: 'NAVIGATE',
        entityType: 'PAGE',
        entityId: this.currentPageVisit.page,
        entityName: `Página: ${this.currentPageVisit.page}`,
        description: `Visitou página ${this.currentPageVisit.page}`,
        metadata: {
          duration: this.currentPageVisit.duration,
          timeSpent: `${Math.round(this.currentPageVisit.duration / 1000)}s`
        }
      })
    }

    // Start new page visit
    this.currentPageVisit = {
      page,
      startTime: Date.now()
    }
  }

  logSearch(searchTerm: string, entityType: string, resultsCount?: number) {
    this.logActivity({
      action: 'SEARCH',
      entityType,
      entityId: 'search',
      entityName: `Pesquisa: "${searchTerm}"`,
      description: `Pesquisou por "${searchTerm}" em ${entityType}`,
      metadata: {
        searchTerm,
        resultsCount,
        searchTimestamp: new Date().toISOString()
      }
    })
  }

  logFilter(filters: Record<string, any>, entityType: string) {
    this.logActivity({
      action: 'FILTER',
      entityType,
      entityId: 'filter',
      entityName: 'Filtros aplicados',
      description: `Aplicou filtros em ${entityType}`,
      metadata: {
        filters,
        filterCount: Object.keys(filters).length
      }
    })
  }

  logSort(sortBy: string, sortOrder: string, entityType: string) {
    this.logActivity({
      action: 'SORT',
      entityType,
      entityId: 'sort',
      entityName: `Ordenação: ${sortBy}`,
      description: `Ordenou ${entityType} por ${sortBy} (${sortOrder})`,
      metadata: {
        sortBy,
        sortOrder
      }
    })
  }

  logExport(entityType: string, format: string, recordCount?: number) {
    this.logActivity({
      action: 'EXPORT',
      entityType,
      entityId: 'export',
      entityName: `Exportação ${format.toUpperCase()}`,
      description: `Exportou dados de ${entityType} em formato ${format}`,
      metadata: {
        format,
        recordCount,
        exportTimestamp: new Date().toISOString()
      }
    })
  }

  logDownload(fileName: string, entityType?: string, entityId?: string) {
    this.logActivity({
      action: 'DOWNLOAD',
      entityType: entityType || 'FILE',
      entityId: entityId || fileName,
      entityName: fileName,
      description: `Descarregou ficheiro: ${fileName}`,
      metadata: {
        fileName,
        downloadTimestamp: new Date().toISOString()
      }
    })
  }

  logPrint(entityType: string, entityId: string, entityName: string) {
    this.logActivity({
      action: 'PRINT',
      entityType,
      entityId,
      entityName,
      description: `Imprimiu ${entityType}: ${entityName}`,
      metadata: {
        printTimestamp: new Date().toISOString()
      }
    })
  }

  logFormSubmit(formType: string, entityType: string, entityId?: string) {
    this.logActivity({
      action: formType === 'create' ? 'CREATE' : 'UPDATE',
      entityType,
      entityId: entityId || 'new',
      entityName: `${formType === 'create' ? 'Novo' : 'Editar'} ${entityType}`,
      description: `${formType === 'create' ? 'Criou' : 'Atualizou'} ${entityType}`,
      metadata: {
        formType,
        submitTimestamp: new Date().toISOString()
      }
    })
  }

  logButtonClick(buttonName: string, context: string, metadata?: Record<string, any>) {
    this.logActivity({
      action: 'ACCESS',
      entityType: 'UI_ELEMENT',
      entityId: buttonName,
      entityName: `Botão: ${buttonName}`,
      description: `Clicou em "${buttonName}" em ${context}`,
      metadata: {
        buttonName,
        context,
        clickTimestamp: new Date().toISOString(),
        ...metadata
      }
    })
  }

  // Cleanup when user leaves
  cleanup() {
    if (this.currentPageVisit) {
      this.currentPageVisit.endTime = Date.now()
      this.currentPageVisit.duration = this.currentPageVisit.endTime - this.currentPageVisit.startTime

      this.logActivity({
        action: 'NAVIGATE',
        entityType: 'PAGE',
        entityId: this.currentPageVisit.page,
        entityName: `Página: ${this.currentPageVisit.page}`,
        description: `Saiu da página ${this.currentPageVisit.page}`,
        metadata: {
          duration: this.currentPageVisit.duration,
          timeSpent: `${Math.round(this.currentPageVisit.duration / 1000)}s`,
          exitType: 'navigation'
        }
      })
    }
  }
}

export function useActivityLogger() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const logger = useRef(ActivityLogger.getInstance())
  const previousPathname = useRef<string>('')

  // Update user info when session changes
  useEffect(() => {
    if (session?.user) {
      logger.current.setUser(
        session.user.id || session.user.email || null,
        session.user.name || session.user.email || null
      )
    } else {
      logger.current.setUser(null, null)
    }
  }, [session])

  // Log page navigation
  useEffect(() => {
    if (pathname !== previousPathname.current) {
      const pageName = pathname.split('/').filter(Boolean).join('/')
      logger.current.logPageVisit(pageName)
      previousPathname.current = pathname
    }
  }, [pathname])

  // Cleanup on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      logger.current.cleanup()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      logger.current.cleanup()
    }
  }, [])

  return {
    logSearch: logger.current.logSearch.bind(logger.current),
    logFilter: logger.current.logFilter.bind(logger.current),
    logSort: logger.current.logSort.bind(logger.current),
    logExport: logger.current.logExport.bind(logger.current),
    logDownload: logger.current.logDownload.bind(logger.current),
    logPrint: logger.current.logPrint.bind(logger.current),
    logFormSubmit: logger.current.logFormSubmit.bind(logger.current),
    logButtonClick: logger.current.logButtonClick.bind(logger.current),
    logActivity: logger.current.logActivity.bind(logger.current)
  }
}
