import { NextResponse } from "next/server"

import { getAuthenticatedOwner } from "@/lib/services/owner/auth"
import { fetchOwnerNotificationCounts } from "@/lib/services/notification-counts"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const counts = await fetchOwnerNotificationCounts(client, userId)
    return NextResponse.json(counts)
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ message: "Failed to fetch notification counts" }, { status: 500 })
  }
}
