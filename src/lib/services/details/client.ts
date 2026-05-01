import { supabaseClient } from "@/lib/supabaseClient"
import type { BookingDetails, DetailRole, InquiryDetails } from "@/lib/services/details/types"

async function getAccessToken() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession()

  const accessToken = session?.access_token

  if (!accessToken) {
    throw new Error("Please log in to continue")
  }

  return accessToken
}

async function fetchDetails<T>(path: string): Promise<T> {
  const accessToken = await getAccessToken()

  const response = await fetch(path, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = (await response.json()) as T & { message?: string }

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load details")
  }

  return data as T
}

export async function getInquiryDetails(
  inquiryId: string,
  role: DetailRole
): Promise<InquiryDetails> {
  const endpoint =
    role === "owner"
      ? `/api/owner/inquiries?id=${encodeURIComponent(inquiryId)}`
      : `/api/client/inquiries?id=${encodeURIComponent(inquiryId)}`

  return fetchDetails<InquiryDetails>(endpoint)
}

export async function getBookingDetails(
  bookingId: string,
  role: DetailRole
): Promise<BookingDetails> {
  const endpoint =
    role === "owner"
      ? `/api/owner/bookings?id=${encodeURIComponent(bookingId)}`
      : `/api/client/bookings?id=${encodeURIComponent(bookingId)}`

  return fetchDetails<BookingDetails>(endpoint)
}

export async function sendMessage(
  inquiryId: string,
  message: string,
  role: DetailRole
): Promise<void> {
  const accessToken = await getAccessToken()
  const endpoint = role === "owner" ? "/api/owner/inquiries" : "/api/client/inquiries"

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ inquiryId, message }),
  })

  const data = (await response.json()) as { message?: string }

  if (!response.ok) {
    throw new Error(data?.message || "Failed to send message")
  }
}
