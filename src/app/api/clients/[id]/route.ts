import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']),
  source: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validatedData = updateClientSchema.parse(body)

    // Clean up empty strings
    const cleanData = Object.fromEntries(
      Object.entries(validatedData).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    )

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Check if email is already taken by another client
    if (cleanData.email && cleanData.email !== existingClient.email) {
      const emailExists = await prisma.client.findFirst({
        where: {
          email: cleanData.email,
          id: { not: id },
        },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Este email já está em uso por outro cliente' },
          { status: 400 }
        )
      }
    }

    // Validate assignedTo user exists
    if (cleanData.assignedTo) {
      const userExists = await prisma.user.findUnique({
        where: { id: cleanData.assignedTo },
      })

      if (!userExists) {
        return NextResponse.json(
          { error: 'Utilizador responsável não encontrado' },
          { status: 400 }
        )
      }
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        ...cleanData,
        assignedTo: cleanData.assignedTo || null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error updating client:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
            leads: true,
          },
        },
      },
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Check if client has associated projects or leads
    if (existingClient._count.projects > 0 || existingClient._count.leads > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível eliminar cliente com projetos ou leads associados',
          details: {
            projects: existingClient._count.projects,
            leads: existingClient._count.leads,
          }
        },
        { status: 400 }
      )
    }

    // Delete client
    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Cliente eliminado com sucesso' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
