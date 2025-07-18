import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
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

    // Define paths
    const backupDir = path.join(process.cwd(), 'prisma', 'backups')
    const backupPath = path.join(backupDir, filename)
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    const dbBackupPath = path.join(process.cwd(), 'prisma', 'dev_backup_before_restore.db')

    // Check if backup file exists
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 })
    }

    // Verify it's actually a backup file
    if (!filename.endsWith('.db') && !filename.endsWith('.sqlite') && !filename.endsWith('.sql')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Create a backup of current database before restore
    if (fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(dbPath, dbBackupPath)
        console.log('Current database backed up before restore')
      } catch (error) {
        console.error('Failed to backup current database:', error)
        return NextResponse.json(
          { error: 'Failed to backup current database before restore' },
          { status: 500 }
        )
      }
    }

    try {
      // Replace current database with backup
      fs.copyFileSync(backupPath, dbPath)

      // Verify restore was successful
      if (!fs.existsSync(dbPath)) {
        // If restore failed, try to restore the backup we made
        if (fs.existsSync(dbBackupPath)) {
          fs.copyFileSync(dbBackupPath, dbPath)
        }
        return NextResponse.json(
          { error: 'Failed to restore backup' },
          { status: 500 }
        )
      }

      // Log successful restore
      console.log(`Database restored from backup: ${filename} by ${session.user.email}`)

      // Clean up the temporary backup (optional - you might want to keep it)
      // if (fs.existsSync(dbBackupPath)) {
      //   fs.unlinkSync(dbBackupPath)
      // }

      return NextResponse.json({
        success: true,
        message: 'Database restored successfully',
        filename,
        restoredBy: session.user.email,
        restoredAt: new Date().toISOString(),
        note: 'Previous database backed up as dev_backup_before_restore.db'
      })

    } catch (error) {
      console.error('Error during restore:', error)
      
      // Try to restore the backup we made if something went wrong
      if (fs.existsSync(dbBackupPath)) {
        try {
          fs.copyFileSync(dbBackupPath, dbPath)
          console.log('Restored original database after failed restore attempt')
        } catch (restoreError) {
          console.error('Failed to restore original database:', restoreError)
        }
      }

      return NextResponse.json(
        { error: 'Failed to restore backup - original database restored' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
