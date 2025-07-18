import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const updatedSettings = await prisma.companySettings.update({
      where: { id: params.id },
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
  } catch (error) {
    console.error("Error updating company settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.companySettings.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Company settings deleted successfully" })
  } catch (error) {
    console.error("Error deleting company settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
