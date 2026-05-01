import { NextResponse } from "next/server"

import { getAuthenticatedUserId } from "@/lib/services/client/auth"
import { fetchClientNotificationCounts } from "@/lib/services/notification-counts"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedUserId(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const counts = await fetchClientNotificationCounts(client, userId)
    return NextResponse.json(counts)
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ message: "Failed to fetch notification counts" }, { status: 500 })
  }
}
