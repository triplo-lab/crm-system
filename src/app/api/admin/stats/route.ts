import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' as any) {
      return NextResponse.json({ error: "Sem permissões de administrador" }, { status: 403 })
    }

    // Get system statistics
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalClients,
      activeClients,
      totalInvoices,
      paidInvoices,
      totalTickets,
      openTickets,
      totalTimeEntries,
      totalKnowledgeArticles
    ] = await Promise.all([
      // Users stats
      prisma.user.count(),
      prisma.user.count(), // All users are considered active for now
      
      // Projects stats
      prisma.project.count(),
      prisma.project.count({
        where: { status: 'IN_PROGRESS' }
      }),
      
      // Clients stats
      prisma.client.count(),
      prisma.client.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Invoices stats
      prisma.invoice.count(),
      prisma.invoice.count({
        where: { status: 'PAID' }
      }),
      
      // Tickets stats - using placeholder values for now
      0, // Total tickets
      0, // Open tickets

      // Time entries stats - using placeholder values for now
      0, // Total time entries

      // Knowledge base stats - using placeholder values for now
      0 // Total knowledge articles
    ])

    // Calculate revenue
    const revenueData = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { total: true }
    })

    // Calculate storage usage (simplified)
    const storageUsed = 1.2 // GB - This would be calculated from actual file storage
    const storageTotal = 10 // GB - This would come from system configuration

    // Determine system health
    let systemHealth: 'GOOD' | 'WARNING' | 'CRITICAL' = 'GOOD'
    const storagePercentage = (storageUsed / storageTotal) * 100
    
    if (storagePercentage > 90) {
      systemHealth = 'CRITICAL'
    } else if (storagePercentage > 75 || openTickets > 10) {
      systemHealth = 'WARNING'
    }

    // Get recent activity counts
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      newUsersToday,
      newProjectsWeek,
      newClientsWeek
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: last24Hours }
        }
      }),
      prisma.project.count({
        where: {
          createdAt: { gte: last7Days }
        }
      }),
      prisma.client.count({
        where: {
          createdAt: { gte: last7Days }
        }
      })
    ])

    const newTicketsToday = 0 // Placeholder for now

    const stats = {
      // Core metrics
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalClients,
      activeClients,
      totalInvoices,
      paidInvoices,
      
      // Financial
      totalRevenue: revenueData._sum.total || 0,
      
      // Support
      totalTickets,
      openTickets,
      
      // System
      systemHealth,
      storageUsed,
      storageTotal,
      storagePercentage: Math.round(storagePercentage),
      
      // Activity
      totalTimeEntries,
      totalKnowledgeArticles,
      
      // Recent activity
      recentActivity: {
        newUsersToday,
        newProjectsWeek,
        newClientsWeek,
        newTicketsToday
      },
      
      // Performance metrics
      performance: {
        userGrowthRate: newUsersToday > 0 ? '+' + newUsersToday : '0',
        projectCompletionRate: totalProjects > 0 ? Math.round(((totalProjects - activeProjects) / totalProjects) * 100) : 0,
        invoicePaymentRate: totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0,
        ticketResolutionRate: totalTickets > 0 ? Math.round(((totalTickets - openTickets) / totalTickets) * 100) : 0
      }
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
