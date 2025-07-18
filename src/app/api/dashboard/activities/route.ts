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

    // Get recent activities from different sources
    const [
      recentProjects,
      recentClients,
      recentInvoices,
      recentTasks
    ] = await Promise.all([
      // Recent projects
      prisma.project.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true } },
          manager: { select: { name: true } }
        }
      }),
      
      // Recent clients
      prisma.client.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' }
      }),
      
      // Recent invoices
      prisma.invoice.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true } }
        }
      }),
      
      // Recent completed tasks
      prisma.task.findMany({
        take: 3,
        where: { 
          completedAt: { not: null }
        },
        orderBy: { completedAt: 'desc' },
        include: {
          project: { select: { name: true } },
          assignee: { select: { name: true } }
        }
      })
    ])

    // Format activities
    const activities: any[] = []

    // Add project activities
    recentProjects.forEach(project => {
      activities.push({
        id: `project-${project.id}`,
        type: 'project',
        title: 'Novo projeto criado',
        description: `${project.name} para ${project.client.name}`,
        time: formatTimeAgo(project.createdAt),
        icon: 'FolderOpen',
        data: project
      })
    })

    // Add client activities
    recentClients.forEach(client => {
      activities.push({
        id: `client-${client.id}`,
        type: 'client',
        title: 'Cliente adicionado',
        description: `${client.name}${client.company ? ` - ${client.company}` : ''}`,
        time: formatTimeAgo(client.createdAt),
        icon: 'Users',
        data: client
      })
    })

    // Add invoice activities
    recentInvoices.forEach(invoice => {
      activities.push({
        id: `invoice-${invoice.id}`,
        type: 'invoice',
        title: `Fatura ${invoice.status === 'PAID' ? 'paga' : 'enviada'}`,
        description: `${invoice.number} para ${invoice.client.name} - €${invoice.total.toFixed(2)}`,
        time: formatTimeAgo(invoice.createdAt),
        icon: 'DollarSign',
        data: invoice
      })
    })

    // Add task activities
    recentTasks.forEach(task => {
      activities.push({
        id: `task-${task.id}`,
        type: 'task',
        title: 'Tarefa concluída',
        description: `${task.title} - ${task.project.name}`,
        time: formatTimeAgo(task.completedAt!),
        icon: 'CheckCircle',
        data: task
      })
    })

    // Sort by time and take the most recent 10
    const sortedActivities = activities
      .sort((a, b) => {
        const timeA = getActivityDate(a)
        const timeB = getActivityDate(b)
        return timeB.getTime() - timeA.getTime()
      })
      .slice(0, 10)

    return NextResponse.json(sortedActivities)

  } catch (error) {
    console.error("Dashboard activities error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Agora mesmo'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hora${hours > 1 ? 's' : ''} atrás`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} dia${days > 1 ? 's' : ''} atrás`
  } else {
    return date.toLocaleDateString('pt-PT')
  }
}

function getActivityDate(activity: any): Date {
  switch (activity.type) {
    case 'task':
      return activity.data.completedAt
    default:
      return activity.data.createdAt
  }
}
