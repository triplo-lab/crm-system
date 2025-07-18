import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const boardType = searchParams.get('boardType') || 'leads'

    const columns = await prisma.kanbanColumn.findMany({
      where: { boardType },
      orderBy: { order: 'asc' }
    })

    // If no columns exist, create default ones
    if (columns.length === 0) {
      const defaultColumns = [
        { columnId: 'NEW', title: 'Novos', color: 'bg-blue-500', order: 0, boardType },
        { columnId: 'CONTACTED', title: 'Contactados', color: 'bg-yellow-500', order: 1, boardType },
        { columnId: 'QUALIFIED', title: 'Qualificados', color: 'bg-green-500', order: 2, boardType },
        { columnId: 'PROPOSAL', title: 'Propostas', color: 'bg-purple-500', order: 3, boardType },
        { columnId: 'NEGOTIATION', title: 'Negociação', color: 'bg-orange-500', order: 4, boardType },
        { columnId: 'WON', title: 'Ganhos', color: 'bg-emerald-500', order: 5, boardType },
        { columnId: 'LOST', title: 'Perdidos', color: 'bg-red-500', order: 6, boardType }
      ]

      await prisma.kanbanColumn.createMany({
        data: defaultColumns
      })

      const newColumns = await prisma.kanbanColumn.findMany({
        where: { boardType },
        orderBy: { order: 'asc' }
      })

      return NextResponse.json(newColumns)
    }

    return NextResponse.json(columns)
  } catch (error) {
    console.error("Error fetching kanban columns:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const column = await prisma.kanbanColumn.create({
      data: {
        columnId: data.columnId,
        title: data.title,
        color: data.color,
        order: data.order || 0,
        boardType: data.boardType || 'leads',
        isVisible: data.isVisible !== undefined ? data.isVisible : true
      }
    })

    return NextResponse.json(column)
  } catch (error) {
    console.error("Error creating kanban column:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Update multiple columns (for reordering)
    if (Array.isArray(data)) {
      const updatePromises = data.map((column: any) =>
        prisma.kanbanColumn.update({
          where: { id: column.id },
          data: {
            title: column.title,
            color: column.color,
            order: column.order,
            isVisible: column.isVisible
          }
        })
      )

      const updatedColumns = await Promise.all(updatePromises)
      return NextResponse.json(updatedColumns)
    }

    // Update single column
    const column = await prisma.kanbanColumn.update({
      where: { id: data.id },
      data: {
        title: data.title,
        color: data.color,
        order: data.order,
        isVisible: data.isVisible
      }
    })

    return NextResponse.json(column)
  } catch (error) {
    console.error("Error updating kanban column:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
