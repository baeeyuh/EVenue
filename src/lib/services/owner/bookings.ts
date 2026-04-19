import type { SupabaseClient } from "@supabase/supabase-js"

export type OwnerBookingRow = {
  id: string
  venue_id: string | null
  venue_name: string
  client_id: string | null
  event_type: string | null
  event_date: string | null
  guest_count: number | null
  status: string | null
  price: number | null
  created_at: string | null
}

type BookingBaseRow = {
  id: string
  venue_id: string | null
  client_id: string | null
  event_type: string | null
  event_date: string | null
  guest_count: number | null
  status: string | null
  price: number | null
  created_at: string | null
}

export async function fetchOwnerBookings(
  client: SupabaseClient,
  ownerId: string
): Promise<OwnerBookingRow[]> {
  const { data: venuesData, error: venuesError } = await client
    .from("venues")
    .select("id, name")
    .eq("owner_id", ownerId)

  if (venuesError) {
    console.error(venuesError)
    throw new Error("Failed to fetch owner venues for bookings")
  }

  const venues = (venuesData ?? []) as Array<{ id: string; name: string | null }>
  const venueIds = venues.map((venue) => venue.id)
  const venueNameMap = new Map(
    venues.map((venue) => [venue.id, venue.name ?? "Unknown venue"])
  )

  if (venueIds.length === 0) return []

  const { data, error } = await client
    .from("bookings")
    .select(
      "id, venue_id, client_id, event_type, event_date, guest_count, status, price, created_at"
    )
    .in("venue_id", venueIds)
    .order("event_date", { ascending: true })

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch owner bookings")
  }

  const bookings = (data as BookingBaseRow[] | null) ?? []

  return bookings.map((booking) => ({
    ...booking,
    venue_name: booking.venue_id
      ? venueNameMap.get(booking.venue_id) ?? "Unknown venue"
      : "Unknown venue",
  }))
}