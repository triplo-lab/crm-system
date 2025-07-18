import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const action = searchParams.get('action') || ''
    const entityType = searchParams.get('entityType') || ''
    const user = searchParams.get('user') || ''
    const date = searchParams.get('date') || ''
    const entityId = searchParams.get('entityId') || undefined
    const userId = searchParams.get('userId') || undefined

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityName: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (action && action !== 'all') {
      where.action = action
    }

    if (entityType && entityType !== 'all') {
      where.entityType = entityType
    }

    if (user && user !== 'all') {
      where.userName = { contains: user, mode: 'insensitive' }
    }

    if (userId) {
      where.userId = userId
    }

    if (entityId) {
      where.entityId = entityId
    }

    if (date && date !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (date) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          where.createdAt = { gte: startDate }
          break
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          where.createdAt = {
            gte: startDate,
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
          break
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          where.createdAt = { gte: startDate }
          break
        case 'last30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          where.createdAt = { gte: startDate }
          break
        case 'thismonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          where.createdAt = { gte: startDate }
          break
        case 'lastmonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endDate = new Date(now.getFullYear(), now.getMonth(), 1)
          where.createdAt = { gte: startDate, lt: endDate }
          break
      }
    }

    // Get activities with pagination
    const [activities, total] = await Promise.all([
      prisma.systemActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          entityName: true,
          userId: true,
          userName: true,
          description: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }),
      prisma.systemActivity.count({ where })
    ])

    // Format activities for display
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      entityName: activity.entityName,
      userId: activity.userId,
      userName: activity.userName,
      description: activity.description,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      createdAt: activity.createdAt.toISOString()
    }))

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching system activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      action,
      entityType,
      entityId,
      entityName,
      description,
      metadata
    } = body

    // Validate required fields
    if (!action || !entityType || !entityId || !entityName) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: action, entityType, entityId, entityName' },
        { status: 400 }
      )
    }

    // Find user by email (more reliable than session.user.id)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 401 })
    }

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    // Create activity log
    const activity = await prisma.systemActivity.create({
      data: {
        action,
        entityType,
        entityId,
        entityName,
        userId: user.id,
        userName: user.name || user.email,
        description: description || `${action} ${entityType}`,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent
      },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        entityName: true,
        description: true,
        createdAt: true
      }
    })

    return NextResponse.json(activity, { status: 201 })

  } catch (error) {
    console.error('Error creating system activity:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'há poucos segundos'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `há ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `há ${diffInMonths} mês${diffInMonths > 1 ? 'es' : ''}`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `há ${diffInYears} ano${diffInYears > 1 ? 's' : ''}`
}
