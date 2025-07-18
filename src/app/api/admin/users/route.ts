import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const includeRoles = searchParams.get('include') === 'roles'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (role && role !== 'all') {
      where.role = role
    }
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get users with related data
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          // status: true, // Will be enabled when field exists
          avatar: true,
          // lastLogin: true, // Will be enabled when field exists
          createdAt: true,
          updatedAt: true,
          userRoles: includeRoles ? {
            include: {
              role: true
            }
          } : false,
          _count: {
            select: {
              managedProjects: true,
              assignedTasks: true,
              timeEntries: true,
              createdTickets: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    // Format users data
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: 'ACTIVE', // Default status until field exists
      avatar: user.avatar,
      lastLogin: null, // Will be populated when field exists
      projectsCount: user._count.managedProjects,
      tasksCount: user._count.assignedTasks,
      timeEntriesCount: user._count.timeEntries,
      ticketsCount: user._count.createdTickets,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Admin users fetch error:", error)
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

    // Check if user is admin
    if (session.user.role !== 'ADMIN' as any) {
      return NextResponse.json({ error: "Sem permissões de administrador" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      email,
      password,
      role = 'EMPLOYEE',
      status = 'ACTIVE'
    } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e password são obrigatórios" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Utilizador com este email já existe" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role.toUpperCase(),
        status,
        // createdBy: session.user.id // Will be added when field exists in schema
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })

  } catch (error) {
    console.error("User creation error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' as any) {
      return NextResponse.json({ error: "Sem permissões de administrador" }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, email, role, status, password } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID do utilizador é obrigatório" },
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

    // Prepare update data
    const updateData: any = {}
    
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) updateData.role = role.toUpperCase()
    if (status) updateData.status = status
    
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
