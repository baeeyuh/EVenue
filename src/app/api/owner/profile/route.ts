import { NextResponse } from "next/server"
import { getAuthenticatedOwner } from "@/lib/services/owner/auth"
import { fetchOwnerProfile } from "@/lib/services/owner/profile"

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