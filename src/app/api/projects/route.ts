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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get projects with related data
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true
            }
          },
          manager: {
            select: {
              id: true,
              name: true
            }
          },

          tasks: {
            select: {
              id: true,
              status: true
            }
          }
        }
      }),
      prisma.project.count({ where })
    ])

    // Format projects data
    const formattedProjects = projects.map(project => {
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter(task => task.status === 'DONE').length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
        actualCost: 0, // Will be calculated from time entries and expenses
        progress,
        client: {
          id: project.client.id,
          name: project.client.name,
          company: project.client.company
        },
        manager: {
          id: project.manager.id,
          name: project.manager.name
        },
        team: [], // Team functionality will be implemented later
        tasksCount: totalTasks,
        completedTasksCount: completedTasks,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }
    })

    return NextResponse.json({
      projects: formattedProjects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Projects fetch error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      clientId,
      managerId,
      startDate,
      endDate,
      budget,
      priority = 'MEDIUM',
      status = 'PLANNING'
    } = body

    // Validate required fields
    if (!name || !description || !clientId || !managerId || !startDate || !budget) {
      return NextResponse.json(
        { error: "Campos obrigatórios em falta" },
        { status: 400 }
      )
    }

    // Verify client and manager exist
    const [client, manager] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      prisma.user.findUnique({ where: { id: managerId } })
    ])

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      )
    }

    if (!manager) {
      return NextResponse.json(
        { error: "Gestor não encontrado" },
        { status: 404 }
      )
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        clientId,
        managerId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        budget: parseFloat(budget),
        priority,
        status,
        // createdBy: session.user.id // Will be added when field exists in schema
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(project, { status: 201 })

  } catch (error) {
    console.error("Project creation error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
