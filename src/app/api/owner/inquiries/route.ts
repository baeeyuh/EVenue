import { NextResponse } from "next/server"
import { getAuthenticatedOwner } from "@/lib/services/owner/auth"
import { getOwnerInquiryDetails } from "@/lib/services/details/server"
import {
  fetchOwnerInquiries,
  sendOwnerInquiryMessage,
  updateInquiryStatus,
} from "@/lib/services/owner/inquiries"
import type { InquiryStatus } from "@/types/inquiry-booking"

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const inquiryId = searchParams.get("id")?.trim()

    if (inquiryId) {
      const inquiry = await getOwnerInquiryDetails(client, userId, inquiryId)

      if (!inquiry) {
        return NextResponse.json({ message: "Inquiry not found" }, { status: 404 })
      }

      return NextResponse.json(inquiry)
    }

    const inquiries = await fetchOwnerInquiries(client, userId)
    return NextResponse.json(inquiries)
  } catch {
    return NextResponse.json({ message: "Failed to fetch inquiries" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const inquiryId =
      typeof body?.inquiryId === "string"
        ? body.inquiryId.trim()
        : typeof body?.id === "string"
          ? body.id.trim()
          : ""
    const status = typeof body?.status === "string" ? body.status.trim().toLowerCase() : ""
    const message = typeof body?.message === "string" ? body.message.trim() : ""

    if (!inquiryId) {
      return NextResponse.json({ message: "Inquiry ID is required" }, { status: 400 })
    }

    if (message) {
      const result = await sendOwnerInquiryMessage(client, userId, inquiryId, message)
      return NextResponse.json(result)
    }

    if (status !== "accepted" && status !== "rejected") {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 })
    }

    const updated = await updateInquiryStatus(client, userId, inquiryId, status as InquiryStatus)
    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update inquiry"
    return NextResponse.json({ message }, { status: 500 })
  }
}