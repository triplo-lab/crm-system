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

    // Check if lead exists and is not already deleted
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    })

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }

    if (existingLead.deletedAt) {
      return NextResponse.json({ error: 'Lead já está na lixeira' }, { status: 400 })
    }

    // Move lead to trash (soft delete)
    const trashedLead = await prisma.lead.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
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
      message: 'Lead movido para a lixeira com sucesso',
      lead: trashedLead,
    })
  } catch (error) {
    console.error('Error moving lead to trash:', error)
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

    // Check if lead exists and is in trash
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    })

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }

    if (!existingLead.deletedAt) {
      return NextResponse.json({ error: 'Lead não está na lixeira' }, { status: 400 })
    }

    // Restore lead from trash
    const restoredLead = await prisma.lead.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    })

    return NextResponse.json({
      message: 'Lead restaurado da lixeira com sucesso',
      lead: restoredLead,
    })
  } catch (error) {
    console.error('Error restoring lead from trash:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
