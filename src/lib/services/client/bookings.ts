import type { SupabaseClient } from "@supabase/supabase-js"

export type ClientBookingRow = {
  id: string
  code: string | null
  status: string | null
  start_date: string
  end_date: string | null
  created_at: string | null
  venue_id: string
  venue_name: string
}

export async function fetchClientBookings(client: SupabaseClient, userId: string): Promise<ClientBookingRow[]> {
  const { data: bookingsData, error: bookingsError } = await client
    .from("bookings")
    .select("id, code, status, start_date, end_date, created_at, venue_id")
    .eq("user_id", userId)
    .order("start_date", { ascending: false })

  if (bookingsError) {
    console.error(bookingsError)
    throw new Error("Failed to fetch client bookings")
  }

  let bookings = (bookingsData ?? []) as Array<{
    id: string
    code: string | null
    status: string | null
    start_date: string
    end_date: string | null
    created_at: string | null
    venue_id: string
  }>

  if (bookings.length === 0 && process.env.NODE_ENV !== "production") {
    const { data: fallbackBookingsData, error: fallbackBookingsError } = await client
      .from("bookings")
      .select("id, code, status, start_date, end_date, created_at, venue_id")
      .order("start_date", { ascending: false })
      .limit(20)

    if (!fallbackBookingsError && fallbackBookingsData) {
      bookings = fallbackBookingsData as typeof bookings
    }
  }

  const venueIds = Array.from(new Set(bookings.map((booking) => booking.venue_id).filter(Boolean)))

  let venueNameMap = new Map<string, string>()

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

  return bookings.map((booking) => ({
    ...booking,
    venue_name: venueNameMap.get(booking.venue_id) ?? "Unknown venue",
  }))
}
