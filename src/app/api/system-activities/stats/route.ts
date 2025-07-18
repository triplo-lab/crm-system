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

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get basic stats
    const [
      totalActivities,
      uniqueUsers,
      activitiesLast24h,
      activitiesLast7d,
      topActions,
      topEntityTypes,
      userActivity,
      hourlyActivity
    ] = await Promise.all([
      // Total activities
      prisma.systemActivity.count(),

      // Unique users
      prisma.systemActivity.findMany({
        select: { userId: true },
        distinct: ['userId']
      }).then(users => users.length),

      // Activities last 24h
      prisma.systemActivity.count({
        where: { createdAt: { gte: last24h } }
      }),

      // Activities last 7 days
      prisma.systemActivity.count({
        where: { createdAt: { gte: last7d } }
      }),

      // Top actions
      prisma.systemActivity.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),

      // Top entity types
      prisma.systemActivity.groupBy({
        by: ['entityType'],
        _count: { entityType: true },
        orderBy: { _count: { entityType: 'desc' } },
        take: 10
      }),

      // User activity (top 10 most active users)
      prisma.systemActivity.groupBy({
        by: ['userId', 'userName'],
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      }),

      // Hourly activity for last 24h
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', "createdAt") as hour,
          COUNT(*) as count
        FROM "SystemActivity"
        WHERE "createdAt" >= ${last24h}
        GROUP BY DATE_TRUNC('hour', "createdAt")
        ORDER BY hour ASC
      `
    ])

    // Format top actions
    const formattedTopActions = topActions.map(item => ({
      action: item.action,
      count: item._count.action
    }))

    // Format top entity types
    const formattedTopEntityTypes = topEntityTypes.map(item => ({
      entityType: item.entityType,
      count: item._count.entityType
    }))

    // Format user activity
    const formattedUserActivity = userActivity.map(item => ({
      userId: item.userId,
      userName: item.userName,
      count: item._count.userId
    }))

    // Format hourly activity
    const formattedHourlyActivity = (hourlyActivity as any[]).map(item => ({
      hour: item.hour,
      count: parseInt(item.count)
    }))

    // Calculate activity trends
    const yesterdayStart = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const yesterdayEnd = last24h

    const activitiesYesterday = await prisma.systemActivity.count({
      where: {
        createdAt: {
          gte: yesterdayStart,
          lt: yesterdayEnd
        }
      }
    })

    const last14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const activitiesLast14d = await prisma.systemActivity.count({
      where: { createdAt: { gte: last14d, lt: last7d } }
    })

    // Calculate percentage changes
    const dailyChange = activitiesYesterday > 0 
      ? ((activitiesLast24h - activitiesYesterday) / activitiesYesterday) * 100 
      : 0

    const weeklyChange = activitiesLast14d > 0 
      ? ((activitiesLast7d - activitiesLast14d) / activitiesLast14d) * 100 
      : 0

    // Get activity by day of week for last 7 days
    const dailyActivity = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as day,
        COUNT(*) as count
      FROM "SystemActivity"
      WHERE "createdAt" >= ${last7d}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `

    const formattedDailyActivity = (dailyActivity as any[]).map(item => ({
      day: item.day,
      count: parseInt(item.count)
    }))

    // Get most active times
    const timeActivity = await prisma.$queryRaw`
      SELECT 
        EXTRACT(hour FROM "createdAt") as hour,
        COUNT(*) as count
      FROM "SystemActivity"
      WHERE "createdAt" >= ${last7d}
      GROUP BY EXTRACT(hour FROM "createdAt")
      ORDER BY count DESC
      LIMIT 5
    `

    const formattedTimeActivity = (timeActivity as any[]).map(item => ({
      hour: parseInt(item.hour),
      count: parseInt(item.count)
    }))

    return NextResponse.json({
      totalActivities,
      uniqueUsers,
      activitiesLast24h,
      activitiesLast7d,
      activitiesYesterday,
      dailyChange: Math.round(dailyChange * 100) / 100,
      weeklyChange: Math.round(weeklyChange * 100) / 100,
      topActions: formattedTopActions,
      topEntityTypes: formattedTopEntityTypes,
      userActivity: formattedUserActivity,
      hourlyActivity: formattedHourlyActivity,
      dailyActivity: formattedDailyActivity,
      timeActivity: formattedTimeActivity,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching activity stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
