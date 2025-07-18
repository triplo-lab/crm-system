import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

// Schema for project update validation
const updateProjectSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  budget: z.number().positive("Orçamento deve ser positivo").optional(),
  clientId: z.string().optional(),
  managerId: z.string().optional(),
  progress: z.number().min(0).max(100).optional()
})

// GET - Fetch single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        proposals: {
          select: {
            id: true,
            title: true,
            status: true,
            total: true
          }
        },
        timeEntries: {
          select: {
            id: true,
            hours: true,
            description: true,
            date: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    // Calculate progress and costs
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(task => task.status === 'COMPLETED').length
    const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    const totalHours = project.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
    const estimatedCost = totalHours * 50 // Assuming 50€/hour rate

    const formattedProject = {
      ...project,
      progress: project.progress || calculatedProgress,
      actualCost: estimatedCost,
      totalHours,
      tasksCount: totalTasks,
      completedTasksCount: completedTasks
    }

    return NextResponse.json(formattedProject)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validatedData = updateProjectSchema.parse(body)

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id }
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    // Verify client and manager exist if they're being updated
    if (validatedData.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: validatedData.clientId }
      })
      if (!client) {
        return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
      }
    }

    if (validatedData.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: validatedData.managerId }
      })
      if (!manager) {
        return NextResponse.json({ error: "Gestor não encontrado" }, { status: 404 })
      }
    }

    // Prepare update data
    const updateData: any = { ...validatedData }
    
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate)
    }
    
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate)
    } else if (validatedData.endDate === null) {
      updateData.endDate = null
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
            timeEntries: true,
            proposals: true,
            invoices: true
          }
        }
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    // Check if project has associated data
    const hasAssociatedData =
      existingProject._count.tasks > 0 ||
      existingProject._count.timeEntries > 0 ||
      existingProject._count.proposals > 0 ||
      existingProject._count.invoices > 0

    if (hasAssociatedData && !force) {
      // Build detailed error message
      const associatedItems = []
      if (existingProject._count.tasks > 0) {
        associatedItems.push(`${existingProject._count.tasks} tarefa(s)`)
      }
      if (existingProject._count.timeEntries > 0) {
        associatedItems.push(`${existingProject._count.timeEntries} entrada(s) de tempo`)
      }
      if (existingProject._count.proposals > 0) {
        associatedItems.push(`${existingProject._count.proposals} proposta(s)`)
      }
      if (existingProject._count.invoices > 0) {
        associatedItems.push(`${existingProject._count.invoices} fatura(s)`)
      }

      const itemsList = associatedItems.join(', ')

      return NextResponse.json(
        {
          error: `Não é possível eliminar o projeto "${existingProject.name}" porque tem dados associados`,
          message: `Este projeto tem ${itemsList} associado(s). Para eliminar este projeto, primeiro elimine ou transfira todos os dados associados.`,
          details: {
            tasks: existingProject._count.tasks,
            timeEntries: existingProject._count.timeEntries,
            proposals: existingProject._count.proposals,
            invoices: existingProject._count.invoices,
            projectName: existingProject.name
          },
          canForceDelete: true
        },
        { status: 400 }
      )
    }

    // If force delete is requested, delete all associated data first
    if (force && hasAssociatedData) {
      await prisma.$transaction(async (tx) => {
        // Delete time entries first (they depend on tasks)
        if (existingProject._count.timeEntries > 0) {
          await tx.timeEntry.deleteMany({
            where: { projectId: id }
          })
        }

        // Delete tasks (including subtasks)
        if (existingProject._count.tasks > 0) {
          await tx.task.deleteMany({
            where: { projectId: id }
          })
        }

        // Delete proposals
        if (existingProject._count.proposals > 0) {
          // First delete proposal items
          const proposals = await tx.proposal.findMany({
            where: { projectId: id },
            select: { id: true }
          })

          for (const proposal of proposals) {
            await tx.proposalItem.deleteMany({
              where: { proposalId: proposal.id }
            })
          }

          // Then delete proposals
          await tx.proposal.deleteMany({
            where: { projectId: id }
          })
        }

        // Delete invoices
        if (existingProject._count.invoices > 0) {
          // First delete invoice items
          const invoices = await tx.invoice.findMany({
            where: { projectId: id },
            select: { id: true }
          })

          for (const invoice of invoices) {
            await tx.invoiceItem.deleteMany({
              where: { invoiceId: invoice.id }
            })
          }

          // Then delete invoices
          await tx.invoice.deleteMany({
            where: { projectId: id }
          })
        }
      })
    }

    // Delete project
    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Projeto eliminado com sucesso' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
