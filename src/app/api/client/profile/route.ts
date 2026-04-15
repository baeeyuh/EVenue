import { NextResponse } from "next/server"
import { fetchClientProfile, updateClientProfile } from "@/lib/services/client/profile"
import { getAuthenticatedUserId } from "@/lib/services/client/auth"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedUserId(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const profile = await fetchClientProfile(client, userId)
    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ message: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedUserId(request)
    const body = await request.json()
    const firstName = typeof body.firstName === "string" ? body.firstName : ""
    const lastName = typeof body.lastName === "string" ? body.lastName : ""

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!firstName.trim() && !lastName.trim()) {
      return NextResponse.json({ message: "At least one name field is required" }, { status: 400 })
    }

    const profile = await updateClientProfile(client, userId, {
      firstName,
      lastName,
    })

    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ message: "Failed to update profile" }, { status: 500 })
  }
}
