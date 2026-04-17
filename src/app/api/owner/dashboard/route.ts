import { NextResponse } from "next/server"
import { getAuthenticatedOwner } from "@/lib/services/owner/auth"
import { fetchOwnerDashboardSummary } from "@/lib/services/owner/dashboard"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const summary = await fetchOwnerDashboardSummary(client, userId)
    return NextResponse.json(summary)
  } catch {
    return NextResponse.json({ message: "Failed to fetch dashboard" }, { status: 500 })
  }
}