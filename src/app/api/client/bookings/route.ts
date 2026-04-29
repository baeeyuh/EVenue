import { NextResponse } from "next/server"
import { fetchClientBookings } from "@/lib/services/client/bookings"
import { getAuthenticatedUserId } from "@/lib/services/client/auth"
import { getClientBookingDetails } from "@/lib/services/details/server"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedUserId(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("id")?.trim()

    if (bookingId) {
      const booking = await getClientBookingDetails(client, userId, bookingId)

      if (!booking) {
        return NextResponse.json({ message: "Booking not found" }, { status: 404 })
      }

      return NextResponse.json(booking)
    }

    const bookings = await fetchClientBookings(client, userId)
    return NextResponse.json(bookings)
  } catch {
    return NextResponse.json({ message: "Failed to fetch bookings" }, { status: 500 })
  }
}
