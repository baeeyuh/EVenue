import { NextResponse } from "next/server"
import { getAuthenticatedOwner } from "@/lib/services/owner/auth"
import { fetchOwnerBookings } from "@/lib/services/owner/bookings"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const bookings = await fetchOwnerBookings(client, userId)
    return NextResponse.json(bookings)
  } catch {
    return NextResponse.json({ message: "Failed to fetch bookings" }, { status: 500 })
  }
}