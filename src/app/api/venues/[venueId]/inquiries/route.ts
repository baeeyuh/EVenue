import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function POST(
  request: Request,
  context: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await context.params
    const body = await request.json()

    const { error } = await supabaseServer.from("venue_inquiries").insert({
      venue_id: venueId,
      full_name: body.fullName,
      email: body.email,
      contact_number: body.contactNumber ?? null,
      event_date: body.eventDate,
      guest_count: body.guestCount ?? null,
      event_type: body.eventType ?? null,
      message: body.message,
      status: "pending",
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