import { NextResponse } from "next/server"
import { fetchClientInquiryById } from "@/lib/services/client/inquiries"
import { getAuthenticatedUserId } from "@/lib/services/client/auth"

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
    const inquiry = await fetchClientInquiryById(client, userId, id)

    if (!inquiry) {
      return NextResponse.json({ message: "Inquiry not found" }, { status: 404 })
    }

    return NextResponse.json(inquiry)
  } catch {
    return NextResponse.json({ message: "Failed to fetch inquiry" }, { status: 500 })
  }
}