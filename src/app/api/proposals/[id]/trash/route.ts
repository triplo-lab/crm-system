import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Find user by email (more reliable than session.user.id)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário da sessão não encontrado' }, { status: 401 })
    }

    // Check if proposal exists and is not already deleted
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
    })

    if (!existingProposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
    }

    if (existingProposal.deletedAt) {
      return NextResponse.json({ error: 'Proposta já está na lixeira' }, { status: 400 })
    }

    // Move proposal to trash (soft delete)
    const trashedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        deletedAt: true,
        deletedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Proposta movida para a lixeira com sucesso',
      proposal: trashedProposal,
    })
  } catch (error) {
    console.error('Error moving proposal to trash:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Find user by email (more reliable than session.user.id)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário da sessão não encontrado' }, { status: 401 })
    }

    // Check if proposal exists and is in trash
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
    })

    if (!existingProposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
    }

    if (!existingProposal.deletedAt) {
      return NextResponse.json({ error: 'Proposta não está na lixeira' }, { status: 400 })
    }

    // Restore proposal from trash
    const restoredProposal = await prisma.proposal.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    })

    return NextResponse.json({
      message: 'Proposta restaurada da lixeira com sucesso',
      proposal: restoredProposal,
    })
  } catch (error) {
    console.error('Error restoring proposal from trash:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
