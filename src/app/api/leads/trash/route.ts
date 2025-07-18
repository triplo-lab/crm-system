import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause for trashed leads
    const where: any = {
      deletedAt: { not: null } // Only show deleted leads
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get trashed leads with pagination
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          source: true,
          status: true,
          value: true,
          notes: true,
          assignedTo: true,
          deletedAt: true,
          deletedBy: true,
          createdAt: true,
          updatedAt: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          deletedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        }
      }),
      prisma.lead.count({ where })
    ])

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching trashed leads:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can permanently delete
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('id')

    if (!leadId) {
      return NextResponse.json({ error: 'ID do lead é obrigatório' }, { status: 400 })
    }

    // Check if lead exists and is in trash
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }

    if (!existingLead.deletedAt) {
      return NextResponse.json({ error: 'Lead não está na lixeira' }, { status: 400 })
    }

    // Permanently delete lead
    await prisma.lead.delete({
      where: { id: leadId },
    })

    return NextResponse.json({
      message: 'Lead eliminado permanentemente com sucesso',
    })
  } catch (error) {
    console.error('Error permanently deleting lead:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
