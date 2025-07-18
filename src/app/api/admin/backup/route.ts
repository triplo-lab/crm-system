import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'prisma', 'backups')
const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')

// Ensure backup directory exists
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR)
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureBackupDir()

    // List all backup files
    const files = await fs.readdir(BACKUP_DIR)
    const backupFiles = files.filter(file => file.endsWith('.db'))

    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(BACKUP_DIR, file)
        const stats = await fs.stat(filePath)
        return {
          name: file,
          size: stats.size,
          created: stats.mtime.toISOString(),
          path: filePath
        }
      })
    )

    // Sort by creation date (newest first)
    backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    return NextResponse.json({ backups })
  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json(
      { error: 'Failed to list backups' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureBackupDir()

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `backup-${timestamp}.db`
    const backupPath = path.join(BACKUP_DIR, backupName)

    // Check if source database exists
    try {
      await fs.access(DB_PATH)
    } catch {
      return NextResponse.json(
        { error: 'Database file not found' },
        { status: 404 }
      )
    }

    // Copy database file to backup location
    await fs.copyFile(DB_PATH, backupPath)

    // Get backup file stats
    const stats = await fs.stat(backupPath)

    const backup = {
      name: backupName,
      size: stats.size,
      created: stats.mtime.toISOString(),
      path: backupPath
    }

    return NextResponse.json({ 
      message: 'Backup created successfully',
      backup 
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    )
  }
}
