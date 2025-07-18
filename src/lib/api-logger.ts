import { NextRequest, NextResponse } from 'next/server'
import { loggingMiddleware } from './logging-middleware'

/**
 * Wrapper function that adds automatic logging to API routes
 */
export function withLogging<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    let response: NextResponse
    
    try {
      // Execute the original handler
      response = await handler(request, ...args)
      
      // Log the request with response info
      await loggingMiddleware.logRequest(request, response)
      
      return response
    } catch (error) {
      // Log the request even if it failed
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
      
      await loggingMiddleware.logRequest(request, errorResponse)
      
      // Re-throw the error
      throw error
    }
  }
}

/**
 * Wrapper for API routes with params
 */
export function withLoggingParams<T extends any[]>(
  handler: (request: NextRequest, context: { params: Promise<any> }, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: Promise<any> }, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    let response: NextResponse
    
    try {
      // Execute the original handler
      response = await handler(request, context, ...args)
      
      // Log the request with response info
      await loggingMiddleware.logRequest(request, response)
      
      return response
    } catch (error) {
      // Log the request even if it failed
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
      
      await loggingMiddleware.logRequest(request, errorResponse)
      
      // Re-throw the error
      throw error
    }
  }
}

/**
 * Manual logging function for custom actions
 */
export async function logUserAction(
  action: string,
  entityType: string,
  entityId: string,
  entityName: string,
  description: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  try {
    const { auditService } = await import('./audit')
    
    await auditService.log({
      action: action as any,
      entityType,
      entityId,
      entityName,
      description,
      metadata
    }, request)
  } catch (error) {
    console.error('Failed to log user action:', error)
  }
}

/**
 * Batch logging for multiple actions
 */
export async function logBatchActions(
  actions: Array<{
    action: string
    entityType: string
    entityId: string
    entityName: string
    description: string
    metadata?: Record<string, any>
  }>,
  request?: NextRequest
) {
  try {
    const { auditService } = await import('./audit')
    
    for (const actionData of actions) {
      await auditService.log({
        action: actionData.action as any,
        entityType: actionData.entityType,
        entityId: actionData.entityId,
        entityName: actionData.entityName,
        description: actionData.description,
        metadata: actionData.metadata
      }, request)
    }
  } catch (error) {
    console.error('Failed to log batch actions:', error)
  }
}

/**
 * Log navigation/page access
 */
export async function logPageAccess(
  page: string,
  section: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  try {
    const { auditService } = await import('./audit')
    
    await auditService.log({
      action: 'NAVIGATE',
      entityType: 'PAGE',
      entityId: page,
      entityName: `${section} - ${page}`,
      description: `Acedeu à página ${section}/${page}`,
      metadata: {
        page,
        section,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    }, request)
  } catch (error) {
    console.error('Failed to log page access:', error)
  }
}

/**
 * Log search actions
 */
export async function logSearch(
  searchTerm: string,
  entityType: string,
  resultsCount: number,
  filters?: Record<string, any>,
  request?: NextRequest
) {
  try {
    const { auditService } = await import('./audit')
    
    await auditService.log({
      action: 'SEARCH',
      entityType,
      entityId: 'search',
      entityName: `Pesquisa: "${searchTerm}"`,
      description: `Pesquisou por "${searchTerm}" em ${entityType} (${resultsCount} resultados)`,
      metadata: {
        searchTerm,
        resultsCount,
        filters,
        timestamp: new Date().toISOString()
      }
    }, request)
  } catch (error) {
    console.error('Failed to log search:', error)
  }
}

/**
 * Log export actions
 */
export async function logExport(
  entityType: string,
  format: string,
  recordCount: number,
  filters?: Record<string, any>,
  request?: NextRequest
) {
  try {
    const { auditService } = await import('./audit')
    
    await auditService.log({
      action: 'EXPORT',
      entityType,
      entityId: 'export',
      entityName: `Exportação ${format.toUpperCase()}`,
      description: `Exportou ${recordCount} registos de ${entityType} em formato ${format.toUpperCase()}`,
      metadata: {
        format,
        recordCount,
        filters,
        timestamp: new Date().toISOString()
      }
    }, request)
  } catch (error) {
    console.error('Failed to log export:', error)
  }
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  event: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE',
  userId?: string,
  userName?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  try {
    const { auditService } = await import('./audit')
    
    const descriptions = {
      LOGIN: 'Fez login no sistema',
      LOGOUT: 'Fez logout do sistema',
      LOGIN_FAILED: 'Tentativa de login falhada',
      PASSWORD_CHANGE: 'Alterou a palavra-passe'
    }
    
    await auditService.log({
      action: event,
      entityType: 'AUTH',
      entityId: userId || 'anonymous',
      entityName: userName || 'Utilizador',
      description: descriptions[event],
      metadata: {
        event,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    }, request)
  } catch (error) {
    console.error('Failed to log auth event:', error)
  }
}

/**
 * Log file operations
 */
export async function logFileOperation(
  operation: 'UPLOAD' | 'DOWNLOAD' | 'DELETE',
  fileName: string,
  fileSize?: number,
  entityType?: string,
  entityId?: string,
  request?: NextRequest
) {
  try {
    const { auditService } = await import('./audit')
    
    const descriptions = {
      UPLOAD: `Carregou ficheiro "${fileName}"`,
      DOWNLOAD: `Descarregou ficheiro "${fileName}"`,
      DELETE: `Eliminou ficheiro "${fileName}"`
    }
    
    await auditService.log({
      action: operation,
      entityType: entityType || 'FILE',
      entityId: entityId || fileName,
      entityName: fileName,
      description: descriptions[operation],
      metadata: {
        fileName,
        fileSize,
        operation,
        timestamp: new Date().toISOString()
      }
    }, request)
  } catch (error) {
    console.error('Failed to log file operation:', error)
  }
}
