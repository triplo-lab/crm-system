import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        items: {
          orderBy: { id: 'asc' },
        },

      },
    })

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    return NextResponse.json(proposal)
  } catch (error) {
    console.error("Error fetching proposal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Calculate total amount from items
    let totalAmount = 0
    if (data.items && Array.isArray(data.items)) {
      totalAmount = data.items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unitPrice)
      }, 0)
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        status: data.status,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        total: totalAmount,
        clientId: data.clientId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        items: {
          orderBy: { id: 'asc' },
        },

      },
    })

    // Update proposal items if provided
    if (data.items && Array.isArray(data.items)) {
      // Delete existing items
      await prisma.proposalItem.deleteMany({
        where: { proposalId: params.id },
      })

      // Create new items
      for (const item of data.items) {
        await prisma.proposalItem.create({
          data: {
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            proposalId: params.id,
          },
        })
      }

      // Fetch updated proposal with items
      const finalProposal = await prisma.proposal.findUnique({
        where: { id: params.id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
            },
          },
          items: {
            orderBy: { id: 'asc' },
          },

        },
      })

      return NextResponse.json(finalProposal)
    }

    return NextResponse.json(updatedProposal)
  } catch (error) {
    console.error("Error updating proposal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.proposal.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Proposal deleted successfully" })
  } catch (error) {
    console.error("Error deleting proposal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
