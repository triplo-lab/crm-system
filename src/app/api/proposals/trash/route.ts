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

    // Build where clause for trashed proposals
    const where: any = {
      deletedAt: { not: null } // Only show deleted proposals
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get trashed proposals with pagination
    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          total: true,
          currency: true,
          validUntil: true,
          deletedAt: true,
          deletedBy: true,
          createdAt: true,
          updatedAt: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
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
      prisma.proposal.count({ where })
    ])

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching trashed proposals:', error)
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
    const proposalId = searchParams.get('id')

    if (!proposalId) {
      return NextResponse.json({ error: 'ID da proposta é obrigatório' }, { status: 400 })
    }

    // Check if proposal exists and is in trash
    const existingProposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    })

    if (!existingProposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
    }

    if (!existingProposal.deletedAt) {
      return NextResponse.json({ error: 'Proposta não está na lixeira' }, { status: 400 })
    }

    // Permanently delete proposal and its items
    await prisma.$transaction([
      prisma.proposalItem.deleteMany({
        where: { proposalId },
      }),
      prisma.proposal.delete({
        where: { id: proposalId },
      }),
    ])

    return NextResponse.json({
      message: 'Proposta eliminada permanentemente com sucesso',
    })
  } catch (error) {
    console.error('Error permanently deleting proposal:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
