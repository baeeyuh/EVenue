import { NextResponse } from "next/server"

import { getAuthenticatedOwner } from "@/lib/services/owner/auth"
import { getOwnerInquiryDetails } from "@/lib/services/details/server"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const inquiry = await getOwnerInquiryDetails(client, userId, id)

    if (!inquiry) {
      return NextResponse.json({ message: "Inquiry not found" }, { status: 404 })
    }

    return NextResponse.json(inquiry)
  } catch {
    return NextResponse.json({ message: "Failed to fetch inquiry details" }, { status: 500 })
  }
}
