import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 })
    }

    const { id } = await params

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            timeEntries: true,
            subtasks: true
          }
        }
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    // Check if task has associated data
    const hasAssociatedData =
      existingTask._count.timeEntries > 0 ||
      existingTask._count.subtasks > 0

    if (hasAssociatedData) {
      const associatedItems = []
      if (existingTask._count.timeEntries > 0) {
        associatedItems.push(`${existingTask._count.timeEntries} entrada(s) de tempo`)
      }
      if (existingTask._count.subtasks > 0) {
        associatedItems.push(`${existingTask._count.subtasks} subtarefa(s)`)
      }

      const itemsList = associatedItems.join(', ')
      
      return NextResponse.json(
        {
          error: `Não é possível eliminar a tarefa "${existingTask.title}" porque tem dados associados`,
          message: `Esta tarefa tem ${itemsList} associado(s). Para eliminar esta tarefa, primeiro elimine ou transfira todos os dados associados.`,
          details: {
            timeEntries: existingTask._count.timeEntries,
            subtasks: existingTask._count.subtasks,
            taskTitle: existingTask.title
          }
        },
        { status: 400 }
      )
    }

    // Delete task
    await prisma.task.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Tarefa eliminada com sucesso' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
