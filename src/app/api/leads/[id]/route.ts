import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logView, logUpdate, logDelete, logMove, logAssignment } from "@/lib/audit"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const lead = await prisma.lead.findUnique({
      where: { id },
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
        createdAt: true,
        updatedAt: true,
        assignee: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    // Log the view
    await logView('lead', lead.id, lead.name, request)

    // Format response to include assignee name
    const response = {
      ...lead,
      assigneeName: lead.assignee?.name || null
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Lead fetch error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
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
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, phone, company, status, source, value, probability, expectedCloseDate, notes, assignedTo } = body

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
      // Check if email is already taken by another lead
      const emailExists = await prisma.lead.findFirst({
        where: {
          email,
          id: { not: id }
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

    // Log specific actions based on what changed
    if (status && existingLead.status !== status) {
      // Log status change (move)
      await logMove(
        'lead',
        updatedLead.id,
        updatedLead.name,
        existingLead.status,
        status,
        request
      )
    }

    if (updateData.assignedTo !== undefined && existingLead.assignedTo !== updateData.assignedTo) {
      // Log assignment change
      if (updateData.assignedTo) {
        const assignedUser = await prisma.user.findUnique({
          where: { id: updateData.assignedTo },
          select: { name: true }
        })
        await logAssignment(
          'lead',
          updatedLead.id,
          updatedLead.name,
          updateData.assignedTo,
          assignedUser?.name || 'Utilizador',
          request
        )
      }
    }

    // Log general update if other fields changed
    const otherChanges = { ...updateData }
    delete otherChanges.status
    delete otherChanges.assignedTo

    if (Object.keys(otherChanges).length > 0) {
      await logUpdate(
        'lead',
        updatedLead.id,
        updatedLead.name,
        otherChanges,
        request
      )
    }

    return NextResponse.json(updatedLead)

  } catch (error) {
    console.error("Lead update error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
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
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

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

    // Log the deletion before deleting
    await logDelete('lead', existingLead.id, existingLead.name, request)

    // Delete lead
    await prisma.lead.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Lead eliminado com sucesso" })

  } catch (error) {
    console.error("Lead deletion error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
