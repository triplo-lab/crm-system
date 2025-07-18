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

    // Define backup directory
    const backupDir = path.join(process.cwd(), 'backups')
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Read backup files
    const files = fs.readdirSync(backupDir)
    const backupFiles = files
      .filter(file => file.endsWith('.db') || file.endsWith('.sqlite') || file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        
        // Parse filename to determine type and date
        const isManual = file.includes('manual')
        const dateMatch = file.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/)
        const fileDate = dateMatch ? dateMatch[1].replace(/_/g, ' ').replace(/-/g, ':') : stats.mtime.toISOString()

        return {
          name: file,
          size: stats.size,
          date: stats.mtime.toISOString(),
          type: isManual ? 'manual' : 'automatic'
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date, newest first

    return NextResponse.json({
      files: backupFiles,
      count: backupFiles.length
    })

  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
