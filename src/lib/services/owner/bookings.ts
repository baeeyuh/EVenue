import type { SupabaseClient } from "@supabase/supabase-js"
import { getOwnerOrgIds } from "@/lib/services/owner/organizations"

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
  start_date: string | null
  status: string | null
  created_at: string | null
}

export async function fetchOwnerBookings(
  client: SupabaseClient,
  ownerId: string
): Promise<OwnerBookingRow[]> {
  const orgIds = await getOwnerOrgIds(client, ownerId)

  if (orgIds.length === 0) return []

  const { data: venuesData, error: venuesError } = await client
    .from("venues")
    .select("id, name")
    .in("organization_id", orgIds)

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
    .select("id, venue_id, start_date, status, created_at")
    .in("venue_id", venueIds)
    .order("start_date", { ascending: true })

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch owner bookings")
  }

  const bookings = (data as BookingBaseRow[] | null) ?? []

  return bookings.map((booking) => ({
    id: booking.id,
    venue_id: booking.venue_id,
    client_id: null,
    event_type: null,
    event_date: booking.start_date,
    guest_count: null,
    status: booking.status,
    price: null,
    created_at: booking.created_at,
    venue_name: booking.venue_id
      ? venueNameMap.get(booking.venue_id) ?? "Unknown venue"
      : "Unknown venue",
  }))
}