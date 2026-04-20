import type { SupabaseClient } from "@supabase/supabase-js"
import { getOwnerOrgIds } from "@/lib/services/owner/organizations"

export type OwnerBookingRow = {
  id: string
  code: string | null
  organization_id: string | null
  venue_id: string | null
  venue_name: string
  client_id: string | null
  event_type: string | null
  event_date: string | null
  end_date: string | null
  guest_count: number | null
  status: string | null
  price: number | null
  created_at: string | null
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

  return (data ?? []) as OwnerBookingRow[]
}