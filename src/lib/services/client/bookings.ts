import type { SupabaseClient } from "@supabase/supabase-js"
import { isMissingColumnError } from "@/lib/services/inquiries/shared"

export type ClientBookingRow = {
  id: string
  code: string | null
  status: string | null
  inquiry_id: string | null
  start_date: string
  end_date: string | null
  event_date: string | null
  guest_count: number | null
  created_at: string | null
  venue_id: string
  venue_name: string
  inquiry_message: string | null
}

type ClientBookingSelectRow = {
  id: string
  code: string | null
  status: string | null
  inquiry_id?: string | null
  start_date: string
  end_date: string | null
  event_date?: string | null
  guest_count?: number | null
  created_at: string | null
  venue_id: string
}

export async function fetchClientBookings(client: SupabaseClient, userId: string): Promise<ClientBookingRow[]> {
  const preferredQuery = await client
    .from("bookings")
    .select("id, code, status, inquiry_id, start_date, end_date, event_date, guest_count, created_at, venue_id")
    .eq("user_id", userId)
    .order("start_date", { ascending: false })

  let bookingsData = preferredQuery.data as ClientBookingSelectRow[] | null
  let bookingsError = preferredQuery.error

  if (
    bookingsError &&
    (isMissingColumnError(bookingsError, "inquiry_id") ||
      isMissingColumnError(bookingsError, "event_date") ||
      isMissingColumnError(bookingsError, "guest_count"))
  ) {
    const fallbackQuery = await client
      .from("bookings")
      .select("id, code, status, start_date, end_date, created_at, venue_id")
      .eq("user_id", userId)
      .order("start_date", { ascending: false })

  bookingsData = fallbackQuery.data as ClientBookingSelectRow[] | null
    bookingsError = fallbackQuery.error
  }

  if (bookingsError) {
    console.error(bookingsError)
    throw new Error("Failed to fetch client bookings")
  }

  let bookings = (bookingsData ?? []) as ClientBookingSelectRow[]

  if (bookings.length === 0 && process.env.NODE_ENV !== "production") {
    const fallbackDebugQuery = await client
      .from("bookings")
      .select("id, code, status, inquiry_id, start_date, end_date, event_date, guest_count, created_at, venue_id")
      .order("start_date", { ascending: false })
      .limit(20)

  let fallbackBookingsData = fallbackDebugQuery.data as ClientBookingSelectRow[] | null
    let fallbackBookingsError = fallbackDebugQuery.error

    if (
      fallbackBookingsError &&
      (isMissingColumnError(fallbackBookingsError, "inquiry_id") ||
        isMissingColumnError(fallbackBookingsError, "event_date") ||
        isMissingColumnError(fallbackBookingsError, "guest_count"))
    ) {
      const fallbackMinimalQuery = await client
        .from("bookings")
        .select("id, code, status, start_date, end_date, created_at, venue_id")
        .order("start_date", { ascending: false })
        .limit(20)

  fallbackBookingsData = fallbackMinimalQuery.data as ClientBookingSelectRow[] | null
      fallbackBookingsError = fallbackMinimalQuery.error
    }

    if (!fallbackBookingsError && fallbackBookingsData) {
      bookings = fallbackBookingsData as typeof bookings
    }
  }

  const venueIds = Array.from(new Set(bookings.map((booking) => booking.venue_id).filter(Boolean)))

  let venueNameMap = new Map<string, string>()
  let inquiryMessageMap = new Map<string, string>()

  if (venueIds.length > 0) {
    const { data: venuesData, error: venuesError } = await client
      .from("venues")
      .select("id, name")
      .in("id", venueIds)

    if (venuesError) {
      console.error(venuesError)
    } else {
      venueNameMap = new Map(
        ((venuesData ?? []) as Array<{ id: string; name: string | null }>).map((venue) => [
          venue.id,
          venue.name ?? "Unknown venue",
        ])
      )
    }
  }

  const inquiryIds = Array.from(
    new Set(bookings.map((booking) => booking.inquiry_id).filter(Boolean))
  ) as string[]

  if (inquiryIds.length > 0) {
    const { data: inquiriesData, error: inquiriesError } = await client
      .from("inquiries")
      .select("id, message")
      .in("id", inquiryIds)

    if (inquiriesError) {
      console.error(inquiriesError)
    } else {
      inquiryMessageMap = new Map(
        ((inquiriesData ?? []) as Array<{ id: string; message: string | null }>).map((inquiry) => [
          inquiry.id,
          inquiry.message ?? "",
        ])
      )
    }
  }

  return bookings.map((booking) => ({
    ...booking,
    inquiry_id: booking.inquiry_id ?? null,
    event_date: booking.event_date ?? null,
    guest_count: booking.guest_count ?? null,
    venue_name: venueNameMap.get(booking.venue_id) ?? "Unknown venue",
    inquiry_message: booking.inquiry_id ? inquiryMessageMap.get(booking.inquiry_id) ?? null : null,
  }))
}
