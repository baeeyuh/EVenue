import { NextResponse } from "next/server"
import { getAuthenticatedOwner } from "@/lib/services/owner/auth"
import { fetchOwnerInquiries } from "@/lib/services/owner/inquiries"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const inquiries = await fetchOwnerInquiries(client, userId)
    return NextResponse.json(inquiries)
  } catch {
    return NextResponse.json({ message: "Failed to fetch inquiries" }, { status: 500 })
  }
}