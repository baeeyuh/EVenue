import { NextResponse } from "next/server"
import { fetchClientBookings } from "@/lib/services/client/bookings"
import { getAuthenticatedUserId } from "@/lib/services/client/auth"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedUserId(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const bookings = await fetchClientBookings(client, userId)
    return NextResponse.json(bookings)
  } catch {
    return NextResponse.json({ message: "Failed to fetch bookings" }, { status: 500 })
  }
}
