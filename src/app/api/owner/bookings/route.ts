import { NextResponse } from "next/server"
import { getAuthenticatedOwner } from "@/lib/services/owner/auth"
import { fetchOwnerBookings } from "@/lib/services/owner/bookings"
import { getOwnerBookingDetails } from "@/lib/services/details/server"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("id")?.trim()

    if (bookingId) {
      const booking = await getOwnerBookingDetails(client, userId, bookingId)

      if (!booking) {
        return NextResponse.json({ message: "Booking not found" }, { status: 404 })
      }

      return NextResponse.json(booking)
    }

    const bookings = await fetchOwnerBookings(client, userId)
    return NextResponse.json(bookings)
  } catch {
    return NextResponse.json({ message: "Failed to fetch bookings" }, { status: 500 })
  }
}