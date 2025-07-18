import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { withMonitoring, monitorDatabaseOperation } from "@/lib/api-monitoring"
import { logCreate } from "@/lib/audit"
import { logSearch, logUserAction } from "@/lib/api-logger"

export const GET = withMonitoring(async function(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const source = searchParams.get('source')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null // Only show non-deleted leads
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (source && source !== 'all') {
      where.source = source
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get leads with pagination - monitored
    const [leads, total] = await monitorDatabaseOperation(
      () => Promise.all([
        prisma.lead.findMany({
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
            status: true,
            source: true,
            value: true,
            probability: true,
            expectedCloseDate: true,
            notes: true,
            assignedTo: true,
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            },
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.lead.count({ where })
      ]),
      'leads-findMany-with-count'
    )

    // Log search if search term was provided
    if (search) {
      await logSearch(search, 'LEADS', leads.length, { status, source }, request)
    }

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Leads fetch error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
})

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
      status = 'NEW',
      source,
      value,
      probability,
      expectedCloseDate,
      notes,
      assignedTo
    } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios" },
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

    // Check if lead with this email already exists (excluding deleted)
    const existingLead = await prisma.lead.findFirst({
      where: {
        email,
        deletedAt: null
      }
    })

    if (existingLead) {
      return NextResponse.json(
        { error: "Lead com este email já existe" },
        { status: 409 }
      )
    }

    // Clean up assignedTo - convert empty string to null
    const cleanAssignedTo = assignedTo && assignedTo.trim() ? assignedTo.trim() : null

    // Validate assignedTo if provided
    if (cleanAssignedTo) {
      const userExists = await prisma.user.findUnique({
        where: { id: cleanAssignedTo }
      })

      if (!userExists) {
        return NextResponse.json(
          { error: "Utilizador atribuído não encontrado" },
          { status: 400 }
        )
      }
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        company,
        status,
        source,
        value: value ? parseFloat(value) : null,
        probability: probability ? parseInt(probability) : null,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        notes,
        assignedTo: cleanAssignedTo
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        status: true,
        source: true,
        value: true,
        probability: true,
        expectedCloseDate: true,
        createdAt: true
      }
    })

    // Log the creation
    await logCreate(
      'lead',
      lead.id,
      lead.name,
      {
        email: lead.email,
        company: lead.company,
        status: lead.status,
        source: lead.source,
        value: lead.value,
        assignedTo: cleanAssignedTo
      },
      request
    )

    return NextResponse.json(lead, { status: 201 })

  } catch (error) {
    console.error("Lead creation error:", error)
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

    const body = await request.json()
    const { id, name, email, phone, company, status, source, value, probability, expectedCloseDate, notes, assignedTo } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID do lead é obrigatório" },
        { status: 400 }
      )
    }

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id }
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (name) updateData.name = name
    if (email) {
      // Check if email is already taken by another lead (excluding deleted)
      const emailExists = await prisma.lead.findFirst({
        where: {
          email,
          id: { not: id },
          deletedAt: null
        }
      })
      
      if (emailExists) {
        return NextResponse.json(
          { error: "Email já está em uso por outro lead" },
          { status: 409 }
        )
      }
      
      updateData.email = email
    }
    if (phone !== undefined) updateData.phone = phone
    if (company !== undefined) updateData.company = company
    if (status) updateData.status = status
    if (source !== undefined) updateData.source = source
    if (value !== undefined) updateData.value = value ? parseFloat(value) : null
    if (probability !== undefined) updateData.probability = probability ? parseInt(probability) : null
    if (expectedCloseDate !== undefined) updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null
    if (notes !== undefined) updateData.notes = notes
    if (assignedTo !== undefined) {
      // Clean up assignedTo - convert empty string to null
      const cleanAssignedTo = assignedTo && assignedTo.trim() ? assignedTo.trim() : null

      if (cleanAssignedTo) {
        // Validate assignedTo if provided
        const userExists = await prisma.user.findUnique({
          where: { id: cleanAssignedTo }
        })

        if (!userExists) {
          return NextResponse.json(
            { error: "Utilizador atribuído não encontrado" },
            { status: 400 }
          )
        }
      }
      updateData.assignedTo = cleanAssignedTo
    }

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        status: true,
        source: true,
        value: true,
        probability: true,
        expectedCloseDate: true,
        notes: true,
        assignedTo: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedLead)

  } catch (error) {
    console.error("Lead update error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
