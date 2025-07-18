import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' as any) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Define backup directory and database path
    const backupDir = path.join(process.cwd(), 'backups')
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Get backup files
    const files = fs.readdirSync(backupDir)
    const backupFiles = files.filter(file => 
      file.endsWith('.db') || file.endsWith('.sqlite') || file.endsWith('.sql')
    )

    // Calculate total size
    let totalSize = 0
    let lastBackupDate: string | null = null

    if (backupFiles.length > 0) {
      const fileStats = backupFiles.map(file => {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        return {
          size: stats.size,
          date: stats.mtime
        }
      })

      totalSize = fileStats.reduce((sum, file) => sum + file.size, 0)
      
      // Find most recent backup
      const mostRecent = fileStats.reduce((latest, current) => 
        current.date > latest.date ? current : latest
      )
      lastBackupDate = mostRecent.date.toISOString()
    }

    // Get database size
    let databaseSize = 0
    if (fs.existsSync(dbPath)) {
      const dbStats = fs.statSync(dbPath)
      databaseSize = dbStats.size
    }

    return NextResponse.json({
      totalBackups: backupFiles.length,
      totalSize,
      lastBackup: lastBackupDate,
      databaseSize
    })

  } catch (error) {
    console.error('Error getting backup stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
