import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cacheDashboardStats } from "@/lib/cache"

// Cached function to get dashboard stats
const getCachedDashboardStats = cacheDashboardStats(
  async () => {
    const [
      totalLeads,
      totalClients,
      totalProjects,
      totalProposals,
      leadsThisMonth,
      clientsThisMonth,
      projectsThisMonth,
      proposalsThisMonth,
      recentLeads,
      recentClients,
      leadsValue,
      proposalsValue
    ] = await Promise.all([
      // Total counts
      prisma.lead.count(),
      prisma.client.count(),
      prisma.project.count(),
      prisma.proposal.count(),

      // This month counts
      prisma.lead.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.client.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.project.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.proposal.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),

      // Recent items
      prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          value: true,
          createdAt: true
        }
      }),
      prisma.client.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true
        }
      }),

      // Value calculations
      prisma.lead.aggregate({
        _sum: {
          value: true
        }
      }),
      prisma.proposal.aggregate({
        _sum: {
          total: true
        }
      })
    ])

    // Calculate changes (mock data for now)
    const projectsChange = projectsThisMonth > 0 ? "+12%" : "0%"
    const clientsChange = clientsThisMonth > 0 ? "+8%" : "0%"
    const revenueChange = (proposalsValue._sum.total || 0) > 0 ? "+15%" : "0%"
    const timeChange = "+5%"

    return {
      projects: {
        total: totalProjects,
        active: totalProjects,
        change: projectsChange,
        trend: projectsThisMonth > 0 ? "up" : "down"
      },
      clients: {
        total: totalClients,
        active: totalClients,
        change: clientsChange,
        trend: clientsThisMonth > 0 ? "up" : "down"
      },
      revenue: {
        total: proposalsValue._sum.total || 0,
        thisMonth: proposalsValue._sum.total || 0,
        change: revenueChange,
        trend: (proposalsValue._sum.total || 0) > 0 ? "up" : "down"
      },
      timeTracking: {
        hoursThisWeek: 40,
        change: timeChange,
        trend: "up"
      },
      // Raw data for other uses
      raw: {
        totalLeads,
        totalClients,
        totalProjects,
        totalProposals,
        leadsThisMonth,
        clientsThisMonth,
        projectsThisMonth,
        proposalsThisMonth,
        recentLeads,
        recentClients,
        leadsValue: leadsValue._sum.value || 0,
        proposalsValue: proposalsValue._sum.total || 0
      }
    }
  },
  'dashboard-stats',
  300 // 5 minutes cache
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get cached dashboard stats
    const stats = await getCachedDashboardStats()

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
