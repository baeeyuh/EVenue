import { NextResponse } from "next/server"
import { fetchClientInquiries } from "@/lib/services/client/inquiries"
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
