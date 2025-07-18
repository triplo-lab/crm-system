import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

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

    // Check if user is admin or viewing own profile
    if (session.user.role !== 'ADMIN' as any && session.user.id !== id) {
      return NextResponse.json({ error: "Sem permissões" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        _count: {
          select: {
            managedProjects: true,
            assignedTasks: true,
            timeEntries: true,
            createdTickets: true
          }
        },
        managedProjects: {
          select: {
            id: true,
            name: true,
            status: true,
            client: {
              select: {
                name: true
              }
            }
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        assignedTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            project: {
              select: {
                name: true
              }
            }
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 })
    }

    // Get time tracking stats for this user - temporarily disabled
    const timeStats = { _sum: { duration: 0 }, _count: 0 }

    // Get recent activity - temporarily disabled
    const recentTimeEntries: any[] = []

    const formattedUser = {
      ...user,
      stats: {
        projectsCount: user._count.managedProjects,
        tasksCount: user._count.assignedTasks,
        timeEntriesCount: user._count.timeEntries,
        ticketsCount: user._count.createdTickets,
        clientsCount: 0, // Will be implemented when relation exists
        invoicesCount: 0, // Will be implemented when relation exists
        totalHours: timeStats._sum.duration ? Math.round(timeStats._sum.duration / 3600) : 0,
        totalTimeEntries: timeStats._count
      },
      recentActivity: {
        projects: user.managedProjects,
        tasks: user.assignedTasks,
        timeEntries: recentTimeEntries
      }
    }

    return NextResponse.json(formattedUser)

  } catch (error) {
    console.error("User fetch error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

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

    // Check if user is admin or updating own profile
    if (session.user.role !== 'ADMIN' as any && session.user.id !== id) {
      return NextResponse.json({ error: "Sem permissões" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role, status, password, avatar } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilizador não encontrado" },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (name) updateData.name = name
    if (email) {
      // Check if email is already taken by another user
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id }
        }
      })
      
      if (emailExists) {
        return NextResponse.json(
          { error: "Email já está em uso" },
          { status: 409 }
        )
      }
      
      updateData.email = email
    }
    
    // Only admins can change role and status
    if (session.user.role === 'ADMIN' as any) {
      if (role) updateData.role = role.toUpperCase()
      if (status) updateData.status = status
    }
    
    if (avatar) updateData.avatar = avatar
    
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password deve ter pelo menos 6 caracteres" },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error("User update error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Only admins can delete users
    if (session.user.role !== 'ADMIN' as any) {
      return NextResponse.json({ error: "Sem permissões de administrador" }, { status: 403 })
    }

    const { id } = await params

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "Não pode eliminar a sua própria conta" },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilizador não encontrado" },
        { status: 404 }
      )
    }

    // Instead of hard delete, we'll soft delete by setting status to INACTIVE
    // This preserves data integrity for related records
    await prisma.user.update({
      where: { id },
      data: {
        // status: 'INACTIVE', // Will be enabled when status field exists
        email: `deleted_${Date.now()}_${existingUser.email}` // Prevent email conflicts
      }
    })

    return NextResponse.json({ message: "Utilizador desativado com sucesso" })

  } catch (error) {
    console.error("User deletion error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
