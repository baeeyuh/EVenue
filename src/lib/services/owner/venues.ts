import type { SupabaseClient } from "@supabase/supabase-js"

export type OwnerVenueRow = {
  id: string
  name: string
  location: string | null
  capacity: number | null
  is_available: boolean | null
  venue_type: string | null
  image: string | null
}

export async function fetchOwnerVenues(
  client: SupabaseClient,
  ownerId: string
): Promise<OwnerVenueRow[]> {
  const { data, error } = await client
    .from("venues")
    .select("id, name, location, capacity, is_available, venue_type, image")
    .eq("owner_id", ownerId)
    .order("name", { ascending: true })

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch owner venues")
  }

  return (data as OwnerVenueRow[] | null) ?? []
}