import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAssignment, logActivity } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, roleId } = await request.json()

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'userId and roleId are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true }
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // Check if user already has this role
    const existingUserRole = await prisma.userRole_Extended.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    })

    if (existingUserRole) {
      return NextResponse.json(
        { error: 'User already has this role' },
        { status: 400 }
      )
    }

    // Assign role to user
    const userRole = await prisma.userRole_Extended.create({
      data: {
        userId,
        roleId,
        assignedBy: session.user.id
      }
    })

    // Log the assignment
    await logAssignment(
      'user',
      userId,
      user.name,
      roleId,
      role.name,
      request
    )

    return NextResponse.json({ userRole }, { status: 201 })
  } catch (error) {
    console.error('Error assigning role to user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, roleId } = await request.json()

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'userId and roleId are required' },
        { status: 400 }
      )
    }

    // Get user and role info for logging
    const [user, role] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true }
      }),
      prisma.role.findUnique({
        where: { id: roleId },
        select: { id: true, name: true }
      })
    ])

    if (!user || !role) {
      return NextResponse.json(
        { error: 'User or role not found' },
        { status: 404 }
      )
    }

    // Remove role from user
    const deletedUserRole = await prisma.userRole_Extended.delete({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    })

    // Log the removal
    await logActivity({
      action: 'DELETE',
      entityType: 'user_role',
      entityId: `${userId}-${roleId}`,
      entityName: `${user.name} - ${role.name}`,
      description: `Removeu função "${role.name}" do utilizador ${user.name}`,
      metadata: { userId, roleId, roleName: role.name }
    }, request)

    return NextResponse.json({ message: 'Role removed successfully' })
  } catch (error) {
    console.error('Error removing role from user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
