import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { USER_ROLES } from '@/types/database'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { type = 'manual', description } = body

    // Define paths
    const backupDir = path.join(process.cwd(), 'backups')
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json(
        { error: 'Database file not found' },
        { status: 404 }
      )
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .slice(0, 19) // Remove milliseconds and timezone
    
    const filename = `backup_${type}_${timestamp}.db`
    const backupPath = path.join(backupDir, filename)

    // Copy database file to backup location
    fs.copyFileSync(dbPath, backupPath)

    // Verify backup was created successfully
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json(
        { error: 'Failed to create backup file' },
        { status: 500 }
      )
    }

    // Get backup file stats
    const stats = fs.statSync(backupPath)

    // Log backup creation (you could also store this in database)
    console.log(`Backup created: ${filename} (${stats.size} bytes) by ${session.user.email}`)

    return NextResponse.json({
      success: true,
      filename,
      size: stats.size,
      type,
      description,
      createdAt: new Date().toISOString(),
      createdBy: session.user.email
    })

  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
