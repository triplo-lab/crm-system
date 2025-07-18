import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null // Only show non-deleted proposals
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status) {
      where.status = status
    }

    // Get proposals with pagination and optimized query
    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          total: true,
          currency: true,
          validUntil: true,
          adminApproved: true,
          adminApprovedAt: true,
          clientApproved: true,
          clientApprovedAt: true,
          createdAt: true,
          updatedAt: true,
          client: {
            select: {
              id: true,
              name: true
            }
          },
          lead: {
            select: {
              id: true,
              name: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.proposal.count({ where })
    ])

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      content,
      clientId,
      leadId,
      projectId,
      validUntil,
      total,
      currency = "EUR",
      createdBy,
      items = []
    } = body

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      )
    }

    // Use provided createdBy or default to first user if not provided
    let finalCreatedBy = createdBy
    if (!finalCreatedBy) {
      const firstUser = await prisma.user.findFirst()
      if (!firstUser) {
        return NextResponse.json(
          { error: "Nenhum usuário encontrado no sistema" },
          { status: 400 }
        )
      }
      finalCreatedBy = firstUser.id
    }

    // Verify creator exists
    const creator = await prisma.user.findUnique({
      where: { id: finalCreatedBy }
    })

    if (!creator) {
      return NextResponse.json(
        { error: "Utilizador criador não encontrado" },
        { status: 400 }
      )
    }

    // Verify client exists if provided
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      })
      if (!client) {
        return NextResponse.json(
          { error: "Cliente não encontrado" },
          { status: 400 }
        )
      }
    }

    // Verify lead exists if provided
    if (leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      })
      if (!lead) {
        return NextResponse.json(
          { error: "Lead não encontrado" },
          { status: 400 }
        )
      }
    }

    // Verify project exists if provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      })
      if (!project) {
        return NextResponse.json(
          { error: "Projeto não encontrado" },
          { status: 400 }
        )
      }
    }

    // Create proposal with items
    const proposal = await prisma.proposal.create({
      data: {
        title,
        description,
        content: content || '',
        clientId,
        leadId,
        projectId,
        validUntil: validUntil ? new Date(validUntil) : null,
        total,
        currency,
        createdBy: finalCreatedBy,
        items: {
          create: items.map((item: any) => ({
            title: item.title,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            total: (item.quantity || 1) * item.unitPrice
          }))
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        lead: {
          select: {
            id: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        },
        items: true
      }
    })

    return NextResponse.json(proposal, { status: 201 })
  } catch (error) {
    console.error('Error creating proposal:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
