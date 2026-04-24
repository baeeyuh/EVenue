import { NextResponse } from "next/server"

import { getAuthenticatedUserId } from "@/lib/services/client/auth"
import { getClientBookingDetails } from "@/lib/services/details/server"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, client } = await getAuthenticatedUserId(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const booking = await getClientBookingDetails(client, userId, id)

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch {
    return NextResponse.json({ message: "Failed to fetch booking details" }, { status: 500 })
  }
}
