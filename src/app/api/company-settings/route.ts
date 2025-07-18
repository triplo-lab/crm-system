import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the first (and should be only) company settings record
    const settings = await prisma.companySettings.findFirst()
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching company settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Check if settings already exist
    const existingSettings = await prisma.companySettings.findFirst()
    
    if (existingSettings) {
      // Update existing settings
      const updatedSettings = await prisma.companySettings.update({
        where: { id: existingSettings.id },
        data: {
          name: data.name,
          address: data.address || null,
          city: data.city || null,
          postalCode: data.postalCode || null,
          country: data.country || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          logo: data.logo || null,
          taxNumber: data.taxNumber || null,
        },
      })
      
      return NextResponse.json(updatedSettings)
    } else {
      // Create new settings
      const newSettings = await prisma.companySettings.create({
        data: {
          name: data.name,
          address: data.address || null,
          city: data.city || null,
          postalCode: data.postalCode || null,
          country: data.country || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          logo: data.logo || null,
          taxNumber: data.taxNumber || null,
        },
      })
      
      return NextResponse.json(newSettings)
    }
  } catch (error) {
    console.error("Error creating/updating company settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
