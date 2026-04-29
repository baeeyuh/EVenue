import { NextResponse } from "next/server"
import { getAuthenticatedUserId } from "@/lib/services/client/auth"
import { createInquiry } from "@/lib/services/client/inquiries"

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

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

    const created = await createInquiry(client, userId, {
      venueId,
      fullName: String(body.fullName ?? ""),
      email: String(body.email ?? ""),
      eventDate: String(body.eventDate ?? ""),
      endDate: body.endDate ? String(body.endDate) : undefined,
      message: String(body.message ?? ""),
      eventType: body.eventType ? String(body.eventType) : undefined,
      guestCount:
        typeof body.guestCount === "number" && Number.isFinite(body.guestCount)
          ? body.guestCount
          : undefined,
      startTime: body.startTime ? String(body.startTime) : undefined,
      endTime: body.endTime ? String(body.endTime) : undefined,
      contactNumber: body.contactNumber ? String(body.contactNumber) : undefined,
    })

    return NextResponse.json({ id: created.id })
  } catch (error: unknown) {
    return NextResponse.json(
      { message: getErrorMessage(error, "Failed to send inquiry") },
      { status: 500 }
    )
  }
}