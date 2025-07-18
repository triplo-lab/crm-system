import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { logApproval } from "@/lib/audit"

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { type, approved, userId } = body

    if (!type || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Type and approved status are required' },
        { status: 400 }
      )
    }

    if (type !== 'admin' && type !== 'client') {
      return NextResponse.json(
        { error: 'Type must be either "admin" or "client"' },
        { status: 400 }
      )
    }

    // Get a valid user ID or null
    let finalUserId = null
    if (userId && userId !== 'current-user-id') {
      // Check if provided userId exists
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user) {
        finalUserId = userId
      }
    }

    // If no valid userId, try to get first user
    if (!finalUserId) {
      const firstUser = await prisma.user.findFirst()
      finalUserId = firstUser?.id || null
    }

    // Prepare update data based on approval type
    const updateData: any = {}

    if (type === 'admin') {
      updateData.adminApproved = approved
      updateData.adminApprovedAt = approved ? new Date() : null
      updateData.adminApprovedBy = approved ? finalUserId : null
    } else if (type === 'client') {
      updateData.clientApproved = approved
      updateData.clientApprovedAt = approved ? new Date() : null
      updateData.clientApprovedBy = approved ? finalUserId : null
    }

    // Check if proposal exists
    const existingProposal = await prisma.proposal.findUnique({
      where: { id }
    })

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Update the proposal
    const proposal = await prisma.proposal.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        adminApproved: true,
        adminApprovedAt: true,
        clientApproved: true,
        clientApprovedAt: true,
        adminApprovedBy: true,
        clientApprovedBy: true
      }
    })

    // Log the approval action
    await logApproval(
      'proposal',
      proposal.id,
      proposal.title,
      approved,
      type === 'admin' ? 'Administrador' : 'Cliente',
      request
    )

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Error updating proposal approval:', error)
    return NextResponse.json(
      { error: 'Failed to update proposal approval' },
      { status: 500 }
    )
  }
}
