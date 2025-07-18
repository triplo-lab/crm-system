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
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get clients with optimized query
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          address: true,
          city: true,
          country: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true
            }
          },
          projects: {
            select: {
              status: true
            },
            where: {
              status: 'IN_PROGRESS'
            }
          }
        }
      }),
      prisma.client.count({ where })
    ])

    // Format clients data
    const formattedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      address: client.address,
      city: client.city,
      country: client.country,
      status: client.status,
      projectsCount: client._count.projects,
      activeProjectsCount: client.projects.length, // Only IN_PROGRESS projects are included
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    }))

    return NextResponse.json({
      clients: formattedClients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Clients fetch error:", error)
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
      email,
      phone,
      company,
      address,
      city,
      country,
      status = 'ACTIVE'
    } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email }
    })

    if (existingClient) {
      return NextResponse.json(
        { error: "Cliente com este email já existe" },
        { status: 409 }
      )
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        company,
        address,
        city,
        country,
        status,
        // createdBy: session.user.id // Will be added when field exists in schema
      }
    })

    return NextResponse.json(client, { status: 201 })

  } catch (error) {
    console.error("Client creation error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
