import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { auditService } from '@/lib/audit'

interface RequestLog {
  method: string
  url: string
  path: string
  query: Record<string, string>
  headers: Record<string, string>
  body?: any
  userAgent?: string
  ipAddress?: string
  userId?: string
  userName?: string
  timestamp: Date
  duration?: number
  statusCode?: number
  responseSize?: number
}

class LoggingMiddleware {
  private excludedPaths = [
    '/api/auth',
    '/favicon.ico',
    '/_next',
    '/api/system-activities',
    '/api/health'
  ]

  private sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token'
  ]

  private sensitiveBodyFields = [
    'password',
    'token',
    'secret',
    'key',
    'credential'
  ]

  /**
   * Check if path should be logged
   */
  private shouldLogPath(path: string): boolean {
    return !this.excludedPaths.some(excluded => path.startsWith(excluded))
  }

  /**
   * Extract client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('x-remote-addr')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return realIP || remoteAddr || 'unknown'
  }

  /**
   * Sanitize headers by removing sensitive information
   */
  private sanitizeHeaders(headers: Headers): Record<string, string> {
    const sanitized: Record<string, string> = {}
    
    headers.forEach((value, key) => {
      if (!this.sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value
      } else {
        sanitized[key] = '[REDACTED]'
      }
    })
    
    return sanitized
  }

  /**
   * Sanitize request body by removing sensitive fields
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body
    }

    const sanitized = { ...body }
    
    for (const field of this.sensitiveBodyFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }
    
    return sanitized
  }

  /**
   * Determine action type based on HTTP method and path
   */
  private determineAction(method: string, path: string): string {
    const pathLower = path.toLowerCase()
    
    // Authentication endpoints
    if (pathLower.includes('/auth/signin')) return 'LOGIN'
    if (pathLower.includes('/auth/signout')) return 'LOGOUT'
    
    // CRUD operations
    switch (method.toUpperCase()) {
      case 'GET':
        if (pathLower.includes('/search')) return 'SEARCH'
        if (pathLower.includes('/export')) return 'EXPORT'
        if (pathLower.includes('/download')) return 'DOWNLOAD'
        return 'VIEW'
      
      case 'POST':
        if (pathLower.includes('/trash')) return 'MOVE'
        if (pathLower.includes('/upload')) return 'UPLOAD'
        if (pathLower.includes('/duplicate')) return 'DUPLICATE'
        return 'CREATE'
      
      case 'PUT':
      case 'PATCH':
        return 'UPDATE'
      
      case 'DELETE':
        if (pathLower.includes('force=true')) return 'FORCE_DELETE'
        if (pathLower.includes('/trash')) return 'RESTORE_FROM_TRASH'
        return 'DELETE'
      
      default:
        return 'ACCESS'
    }
  }

  /**
   * Determine entity type from path
   */
  private determineEntityType(path: string): string {
    const pathSegments = path.split('/').filter(Boolean)
    
    if (pathSegments.includes('api')) {
      const apiIndex = pathSegments.indexOf('api')
      if (apiIndex + 1 < pathSegments.length) {
        return pathSegments[apiIndex + 1].toUpperCase()
      }
    }
    
    if (pathSegments.includes('dashboard')) {
      const dashboardIndex = pathSegments.indexOf('dashboard')
      if (dashboardIndex + 1 < pathSegments.length) {
        return pathSegments[dashboardIndex + 1].toUpperCase()
      }
    }
    
    return 'SYSTEM'
  }

  /**
   * Extract entity ID from path
   */
  private extractEntityId(path: string): string {
    const pathSegments = path.split('/').filter(Boolean)
    
    // Look for UUID-like patterns
    for (const segment of pathSegments) {
      if (segment.match(/^[a-zA-Z0-9]{20,}$/)) {
        return segment
      }
    }
    
    return 'unknown'
  }

  /**
   * Log HTTP request
   */
  async logRequest(request: NextRequest, response?: NextResponse): Promise<void> {
    try {
      const path = new URL(request.url).pathname
      
      // Skip logging for excluded paths
      if (!this.shouldLogPath(path)) {
        return
      }

      const startTime = Date.now()
      const method = request.method
      const url = request.url
      const query = Object.fromEntries(new URL(request.url).searchParams)
      const headers = this.sanitizeHeaders(request.headers)
      const userAgent = request.headers.get('user-agent') || undefined
      const ipAddress = this.getClientIP(request)

      // Get user session
      let userId: string | undefined
      let userName: string | undefined
      
      try {
        const session = await getServerSession(authOptions)
        if (session?.user?.email) {
          // Find user by email for more reliable identification
          const { prisma } = await import('@/lib/db')
          const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true, email: true }
          })
          
          if (user) {
            userId = user.id
            userName = user.name || user.email
          }
        }
      } catch (sessionError) {
        console.warn('Failed to get session for logging:', sessionError)
      }

      // Get request body for POST/PUT requests
      let body: any
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          const clonedRequest = request.clone()
          const text = await clonedRequest.text()
          if (text) {
            body = JSON.parse(text)
            body = this.sanitizeBody(body)
          }
        } catch (bodyError) {
          // Body might not be JSON, that's okay
        }
      }

      // Determine action and entity info
      const action = this.determineAction(method, path)
      const entityType = this.determineEntityType(path)
      const entityId = this.extractEntityId(path)

      // Create request log
      const requestLog: RequestLog = {
        method,
        url,
        path,
        query,
        headers,
        body,
        userAgent,
        ipAddress,
        userId,
        userName,
        timestamp: new Date(),
        statusCode: response?.status,
        duration: response ? Date.now() - startTime : undefined
      }

      // Log to audit system if user is authenticated
      if (userId && action !== 'VIEW') { // Don't log every view to avoid spam
        await auditService.log({
          action: action as any,
          entityType,
          entityId,
          entityName: this.generateEntityName(entityType, entityId, body),
          description: this.generateDescription(action, entityType, method, path),
          metadata: {
            method,
            path,
            query,
            userAgent,
            duration: requestLog.duration,
            statusCode: requestLog.statusCode
          },
          userId,
          userName
        }, request)
      }

      // Store detailed request log (you could save this to a separate table if needed)
      console.log('Request logged:', {
        action,
        entityType,
        entityId,
        userId: userId || 'anonymous',
        method,
        path,
        statusCode: response?.status
      })

    } catch (error) {
      console.error('Failed to log request:', error)
      // Don't throw error to avoid breaking the request
    }
  }

  /**
   * Generate entity name for logging
   */
  private generateEntityName(entityType: string, entityId: string, body?: any): string {
    if (body?.name) return body.name
    if (body?.title) return body.title
    if (body?.email) return body.email
    
    return `${entityType}-${entityId}`
  }

  /**
   * Generate description for the action
   */
  private generateDescription(action: string, entityType: string, method: string, path: string): string {
    const entity = entityType.toLowerCase()
    
    switch (action) {
      case 'CREATE': return `Criou novo ${entity}`
      case 'UPDATE': return `Atualizou ${entity}`
      case 'DELETE': return `Eliminou ${entity}`
      case 'FORCE_DELETE': return `Forçou eliminação de ${entity}`
      case 'VIEW': return `Visualizou ${entity}`
      case 'SEARCH': return `Pesquisou em ${entity}`
      case 'EXPORT': return `Exportou dados de ${entity}`
      case 'DOWNLOAD': return `Descarregou ${entity}`
      case 'UPLOAD': return `Carregou ficheiro para ${entity}`
      case 'MOVE': return `Moveu ${entity} para lixeira`
      case 'RESTORE_FROM_TRASH': return `Restaurou ${entity} da lixeira`
      case 'DUPLICATE': return `Duplicou ${entity}`
      default: return `Executou ${method} em ${path}`
    }
  }
}

export const loggingMiddleware = new LoggingMiddleware()
