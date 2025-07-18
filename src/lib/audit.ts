import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'

export type SystemAction =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'REJECT'
  | 'SEND' | 'COMPLETE' | 'ASSIGN' | 'MOVE'
  | 'EXPORT' | 'IMPORT' | 'BACKUP' | 'RESTORE'
  | 'SEARCH' | 'FILTER' | 'SORT' | 'PAGINATE'
  | 'DOWNLOAD' | 'UPLOAD' | 'PRINT' | 'SHARE'
  | 'NAVIGATE' | 'ACCESS' | 'REFRESH' | 'COPY'
  | 'DUPLICATE' | 'ARCHIVE' | 'UNARCHIVE' | 'RESTORE_FROM_TRASH'
  | 'FORCE_DELETE' | 'BULK_ACTION' | 'SETTINGS_CHANGE'
  | 'PASSWORD_CHANGE' | 'PROFILE_UPDATE' | 'SESSION_START' | 'SESSION_END'

export interface AuditLogData {
  action: SystemAction
  entityType: string
  entityId: string
  entityName?: string
  description: string
  metadata?: Record<string, any>
  userId?: string
  userName?: string
  ipAddress?: string
  userAgent?: string
}

class AuditService {
  /**
   * Log a system activity
   */
  async log(data: AuditLogData, request?: NextRequest) {
    try {
      // Get user info if not provided
      let userId = data.userId
      let userName = data.userName

      if (!userId || !userName) {
        const session = await getServerSession(authOptions)
        if (session?.user) {
          userId = session.user.id
          userName = session.user.name || session.user.email
        }
      }

      // Extract IP and User Agent from request
      const ipAddress = data.ipAddress || this.getClientIP(request)
      const userAgent = data.userAgent || request?.headers.get('user-agent') || undefined

      // Only create audit log if we have a valid userId
      if (userId) {
        // Verify user exists before creating audit log
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true }
        })

        if (userExists) {
          // Create the audit log entry
          await prisma.systemActivity.create({
            data: {
              action: data.action,
              entityType: data.entityType,
              entityId: data.entityId,
              entityName: data.entityName,
              userId: userId,
              userName: userExists.name || userExists.email || 'Unknown User',
              description: data.description,
              metadata: data.metadata ? JSON.stringify(data.metadata) : null,
              ipAddress,
              userAgent,
            }
          })
        } else {
          // Log warning but don't fail the operation
          console.warn(`⚠️ Audit log skipped: User ${userId} not found in database`)

          // Don't try to create system audit log with invalid userId
          // Just log the warning - this prevents foreign key constraint errors
          console.warn(`⚠️ Skipping system audit log creation due to missing user: ${userId}`)
        }
      } else {
        console.warn('⚠️ Audit log skipped: No valid userId provided')
      }
    } catch (error) {
      console.error('Failed to log audit activity:', error)
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log entity creation
   */
  async logCreate(
    entityType: string,
    entityId: string,
    entityName: string,
    metadata?: Record<string, any>,
    request?: NextRequest
  ) {
    await this.log({
      action: 'CREATE',
      entityType,
      entityId,
      entityName,
      description: `Criou ${this.getEntityDisplayName(entityType)}: ${entityName}`,
      metadata
    }, request)
  }

  /**
   * Log entity update
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    entityName: string,
    changes?: Record<string, any>,
    request?: NextRequest
  ) {
    await this.log({
      action: 'UPDATE',
      entityType,
      entityId,
      entityName,
      description: `Atualizou ${this.getEntityDisplayName(entityType)}: ${entityName}`,
      metadata: changes
    }, request)
  }

  /**
   * Log entity deletion
   */
  async logDelete(
    entityType: string,
    entityId: string,
    entityName: string,
    request?: NextRequest
  ) {
    await this.log({
      action: 'DELETE',
      entityType,
      entityId,
      entityName,
      description: `Eliminou ${this.getEntityDisplayName(entityType)}: ${entityName}`,
    }, request)
  }

  /**
   * Log entity view/access
   */
  async logView(
    entityType: string,
    entityId: string,
    entityName: string,
    request?: NextRequest
  ) {
    await this.log({
      action: 'VIEW',
      entityType,
      entityId,
      entityName,
      description: `Visualizou ${this.getEntityDisplayName(entityType)}: ${entityName}`,
    }, request)
  }

  /**
   * Log approval actions
   */
  async logApproval(
    entityType: string,
    entityId: string,
    entityName: string,
    approved: boolean,
    approverType: string,
    request?: NextRequest
  ) {
    const action = approved ? 'APPROVE' : 'REJECT'
    const actionText = approved ? 'Aprovou' : 'Rejeitou'
    
    await this.log({
      action,
      entityType,
      entityId,
      entityName,
      description: `${actionText} ${this.getEntityDisplayName(entityType)}: ${entityName} (${approverType})`,
      metadata: { approved, approverType }
    }, request)
  }

  /**
   * Log assignment actions
   */
  async logAssignment(
    entityType: string,
    entityId: string,
    entityName: string,
    assignedTo: string,
    assignedToName: string,
    request?: NextRequest
  ) {
    await this.log({
      action: 'ASSIGN',
      entityType,
      entityId,
      entityName,
      description: `Atribuiu ${this.getEntityDisplayName(entityType)} "${entityName}" a ${assignedToName}`,
      metadata: { assignedTo, assignedToName }
    }, request)
  }

  /**
   * Log status/stage changes
   */
  async logMove(
    entityType: string,
    entityId: string,
    entityName: string,
    fromStatus: string,
    toStatus: string,
    request?: NextRequest
  ) {
    await this.log({
      action: 'MOVE',
      entityType,
      entityId,
      entityName,
      description: `Moveu ${this.getEntityDisplayName(entityType)} "${entityName}" de "${fromStatus}" para "${toStatus}"`,
      metadata: { fromStatus, toStatus }
    }, request)
  }

  /**
   * Log user login
   */
  async logLogin(userId: string, userName: string, request?: NextRequest) {
    await this.log({
      action: 'LOGIN',
      entityType: 'user',
      entityId: userId,
      entityName: userName,
      description: `${userName} fez login no sistema`,
      userId,
      userName
    }, request)
  }

  /**
   * Log user logout
   */
  async logLogout(userId: string, userName: string, request?: NextRequest) {
    await this.log({
      action: 'LOGOUT',
      entityType: 'user',
      entityId: userId,
      entityName: userName,
      description: `${userName} fez logout do sistema`,
      userId,
      userName
    }, request)
  }

  /**
   * Get recent activities for dashboard
   */
  async getRecentActivities(limit = 20, entityType?: string, entityId?: string) {
    const where: any = {}
    
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId

    return await prisma.systemActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })
  }

  /**
   * Get activities for a specific entity
   */
  async getEntityActivities(entityType: string, entityId: string, limit = 50) {
    return await prisma.systemActivity.findMany({
      where: {
        entityType,
        entityId
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })
  }

  /**
   * Get user activity history
   */
  async getUserActivities(userId: string, limit = 100) {
    return await prisma.systemActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  /**
   * Helper methods
   */
  private getEntityDisplayName(entityType: string): string {
    const displayNames: Record<string, string> = {
      'lead': 'lead',
      'client': 'cliente',
      'project': 'projeto',
      'proposal': 'proposta',
      'task': 'tarefa',
      'invoice': 'fatura',
      'ticket': 'ticket',
      'user': 'utilizador',
      'article': 'artigo'
    }
    return displayNames[entityType] || entityType
  }

  private getClientIP(request?: NextRequest): string | undefined {
    if (!request) return undefined
    
    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-client-ip') ||
      undefined
    )
  }
}

// Export singleton instance
export const auditService = new AuditService()

// Convenience functions
export const logActivity = auditService.log.bind(auditService)
export const logCreate = auditService.logCreate.bind(auditService)
export const logUpdate = auditService.logUpdate.bind(auditService)
export const logDelete = auditService.logDelete.bind(auditService)
export const logView = auditService.logView.bind(auditService)
export const logApproval = auditService.logApproval.bind(auditService)
export const logAssignment = auditService.logAssignment.bind(auditService)
export const logMove = auditService.logMove.bind(auditService)
export const logLogin = auditService.logLogin.bind(auditService)
export const logLogout = auditService.logLogout.bind(auditService)
