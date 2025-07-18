import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' as any) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { filename } = body

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    // Define backup directory and file path
    const backupDir = path.join(process.cwd(), 'prisma', 'backups')
    const filePath = path.join(backupDir, filename)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 })
    }

    // Verify it's actually a backup file
    if (!filename.endsWith('.db') && !filename.endsWith('.sqlite') && !filename.endsWith('.sql')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Delete the file
    fs.unlinkSync(filePath)

    // Verify file was deleted
    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Failed to delete backup file' }, { status: 500 })
    }

    // Log deletion
    console.log(`Backup deleted: ${filename} by ${session.user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully',
      filename,
      deletedBy: session.user.email,
      deletedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error deleting backup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
