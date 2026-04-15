import { NextResponse } from "next/server"
import { fetchClientSavedItems, removeClientSavedItem } from "@/lib/services/client/saved"
import { getAuthenticatedUserId } from "@/lib/services/client/auth"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedUserId(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const items = await fetchClientSavedItems(client, userId)
    return NextResponse.json(items)
  } catch {
    return NextResponse.json({ message: "Failed to fetch saved items" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedUserId(request)
    const url = new URL(request.url)
    const savedItemId = url.searchParams.get("savedItemId")

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!savedItemId) {
      return NextResponse.json({ message: "savedItemId is required" }, { status: 400 })
    }

    await removeClientSavedItem(client, userId, savedItemId)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ message: "Failed to remove saved item" }, { status: 500 })
  }
}
