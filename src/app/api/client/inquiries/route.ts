import { NextResponse } from "next/server"
import {
  confirmBooking,
  fetchClientInquiries,
  sendClientInquiryMessage,
} from "@/lib/services/client/inquiries"
import { getAuthenticatedUserId } from "@/lib/services/client/auth"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedUserId(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const inquiries = await fetchClientInquiries(client, userId)
    return NextResponse.json(inquiries)
  } catch {
    return NextResponse.json({ message: "Failed to fetch inquiries" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedUserId(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const inquiryId = typeof body?.inquiryId === "string" ? body.inquiryId.trim() : ""

    if (!inquiryId) {
      return NextResponse.json({ message: "Inquiry ID is required" }, { status: 400 })
    }

    const result = await confirmBooking(client, userId, inquiryId)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to confirm booking"
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedUserId(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const inquiryId = typeof body?.inquiryId === "string" ? body.inquiryId.trim() : ""
    const message = typeof body?.message === "string" ? body.message.trim() : ""

    if (!inquiryId) {
      return NextResponse.json({ message: "Inquiry ID is required" }, { status: 400 })
    }

    if (!message) {
      return NextResponse.json({ message: "Message is required" }, { status: 400 })
    }

    const result = await sendClientInquiryMessage(client, userId, inquiryId, message)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send message"
    return NextResponse.json({ message }, { status: 500 })
  }
}
