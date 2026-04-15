import { NextResponse } from "next/server"
import { getAuthenticatedUserId } from "@/lib/services/client/auth"

export async function POST(
  request: Request,
  context: { params: Promise<{ venueId: string }> }
) {
  try {
    const { userId, client } = await getAuthenticatedUserId(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { venueId } = await context.params
    const body = await request.json()

    if (!body?.message || !body?.eventDate) {
      return NextResponse.json(
        { message: "Event date and message are required" },
        { status: 400 }
      )
    }

    const metaParts = [
      `Venue: ${body.venueName ?? venueId}`,
      `Event date: ${body.eventDate}`,
      body.eventType ? `Event type: ${body.eventType}` : null,
      body.guestCount ? `Guest count: ${body.guestCount}` : null,
      body.startTime ? `Start time: ${body.startTime}` : null,
      body.endTime ? `End time: ${body.endTime}` : null,
      body.contactNumber ? `Contact number: ${body.contactNumber}` : null,
      body.email ? `Email: ${body.email}` : null,
      body.fullName ? `Full name: ${body.fullName}` : null,
      "",
      "Message:",
      body.message,
    ]

    const composedMessage = metaParts.filter(Boolean).join("\n")

    const { error } = await client.from("inquiries").insert({
      id: crypto.randomUUID(),
      user_id: userId,
      venue_id: venueId,
      message: composedMessage,
      status: "Pending",
    })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Failed to send inquiry" },
      { status: 500 }
    )
  }
}