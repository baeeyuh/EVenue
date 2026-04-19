import { NextResponse } from "next/server"
import { getAuthenticatedOwner } from "@/lib/services/owner/auth"
import { fetchOwnerVenues } from "@/lib/services/owner/venues"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const venues = await fetchOwnerVenues(client, userId)
    return NextResponse.json(venues)
  } catch {
    return NextResponse.json({ message: "Failed to fetch venues" }, { status: 500 })
  }
}