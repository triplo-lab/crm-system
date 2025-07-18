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

    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Get upcoming tasks
    const upcomingTasks = await prisma.task.findMany({
      where: {
        status: {
          in: ['TODO', 'IN_PROGRESS']
        },
        dueDate: {
          gte: now,
          lte: nextWeek
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' }
      ],
      take: 10,
      include: {
        project: {
          select: {
            name: true,
            client: {
              select: { name: true }
            }
          }
        },
        assignee: {
          select: { name: true }
        }
      }
    })

    // Format tasks
    const formattedTasks = upcomingTasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      project: task.project.name,
      client: task.project.client?.name,
      assignee: task.assignee?.name,
      priority: task.priority.toLowerCase(),
      status: task.status.toLowerCase(),
      dueDate: task.dueDate,
      dueDateFormatted: formatDueDate(task.dueDate!),
      isOverdue: task.dueDate! < now,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours
    }))

    return NextResponse.json(formattedTasks)

  } catch (error) {
    console.error("Upcoming tasks error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

function formatDueDate(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (taskDate.getTime() === today.getTime()) {
    return `Hoje, ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
  } else if (taskDate.getTime() === tomorrow.getTime()) {
    return `Amanhã, ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
  } else {
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    const dayName = dayNames[date.getDay()]
    return `${dayName}, ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
  }
}
