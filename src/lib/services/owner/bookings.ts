import type { SupabaseClient } from "@supabase/supabase-js"
import { getOwnerOrgIds } from "@/lib/services/owner/organizations"

export type OwnerBookingRow = {
  id: string
  code: string | null
  organization_id: string | null
  venue_id: string | null
  venue_name: string
  inquiry_id: string | null
  client_id: string | null
  event_type: string | null
  event_date: string | null
  end_date: string | null
  guest_count: number | null
  status: string | null
  price: number | null
  created_at: string | null
  inquiry_message: string | null
}

export async function fetchOwnerBookings(
  client: SupabaseClient,
  ownerId: string
): Promise<OwnerBookingRow[]> {
  const orgIds = await getOwnerOrgIds(client, ownerId)

  if (orgIds.length === 0) return []

  const { data, error } = await client
    .from("owner_bookings_view")
    .select("*")
    .in("organization_id", orgIds)
    .order("event_date", { ascending: true })

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch owner bookings")
  }

  const bookings = (data ?? []) as OwnerBookingRow[]

  if (bookings.length === 0) {
    return []
  }

  const bookingIds = bookings.map((booking) => booking.id)
  let bookingInquiryMap = new Map<string, string | null>()

  const explicitInquiryIds = bookings
    .map((booking) => booking.inquiry_id)
    .filter((value): value is string => Boolean(value))

  if (explicitInquiryIds.length > 0) {
    bookingInquiryMap = new Map(
      bookings.map((booking) => [booking.id, booking.inquiry_id ?? null])
    )
  } else {
    const bookingLookup = await client
      .from("bookings")
      .select("id, inquiry_id")
      .in("id", bookingIds)

    if (!bookingLookup.error && bookingLookup.data) {
      bookingInquiryMap = new Map(
        (bookingLookup.data as Array<{ id: string; inquiry_id: string | null }>).map((row) => [
          row.id,
          row.inquiry_id,
        ])
      )
    }
  }

  const inquiryIds = Array.from(new Set(Array.from(bookingInquiryMap.values()).filter(Boolean))) as string[]
  let inquiryMessageMap = new Map<string, string>()

  if (inquiryIds.length > 0) {
    const inquiryLookup = await client
      .from("inquiries")
      .select("id, message")
      .in("id", inquiryIds)

    if (!inquiryLookup.error && inquiryLookup.data) {
      inquiryMessageMap = new Map(
        (inquiryLookup.data as Array<{ id: string; message: string | null }>).map((row) => [
          row.id,
          row.message ?? "",
        ])
      )
    }
  }

  return bookings.map((booking) => {
    const inquiryId = booking.inquiry_id ?? bookingInquiryMap.get(booking.id) ?? null

    return {
      ...booking,
      inquiry_id: inquiryId,
      inquiry_message: inquiryId ? inquiryMessageMap.get(inquiryId) ?? null : null,
    }
  })
}