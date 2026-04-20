import { NextResponse } from "next/server"
import { getAuthenticatedOwner } from "@/lib/services/owner/auth"
import { fetchOwnerProfile, updateOwnerProfile } from "@/lib/services/owner/profile"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const profile = await fetchOwnerProfile(client, userId)
    return NextResponse.json(profile)
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ message: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const firstName = typeof body.firstName === "string" ? body.firstName : ""
    const lastName = typeof body.lastName === "string" ? body.lastName : ""
    const contactNumber =
      typeof body.contactNumber === "string" ? body.contactNumber : ""

    if (!firstName.trim() && !lastName.trim()) {
      return NextResponse.json(
        { message: "At least one name field is required" },
        { status: 400 }
      )
    }

    const profile = await updateOwnerProfile(client, userId, {
      firstName,
      lastName,
      contactNumber,
    })

    return NextResponse.json(profile)
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ message: "Failed to update profile" }, { status: 500 })
  }
}