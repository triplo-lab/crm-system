import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (projectId) {
      where.projectId = projectId
    }

    // Get time entries with pagination
    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          description: true,
          startTime: true,
          endTime: true,
          duration: true,
          isRunning: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          },
          task: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          startTime: 'desc'
        }
      }),
      prisma.timeEntry.count({ where })
    ])

    return NextResponse.json({
      timeEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      description,
      hours,
      date,
      billable = false,
      hourlyRate,
      userId,
      projectId
    } = body

    // Validate required fields
    if (!description || !hours || !date || !userId) {
      return NextResponse.json(
        { error: 'Description, hours, date, and userId are required' },
        { status: 400 }
      )
    }

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        description,
        hours: parseFloat(hours),
        date: new Date(date),
        billable,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        userId,
        projectId: projectId || null
      },
      select: {
        id: true,
        description: true,
        hours: true,
        date: true,
        billable: true,
        hourlyRate: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(timeEntry, { status: 201 })
  } catch (error) {
    console.error('Error creating time entry:', error)
    return NextResponse.json(
      { error: 'Failed to create time entry' },
      { status: 500 }
    )
  }
}
