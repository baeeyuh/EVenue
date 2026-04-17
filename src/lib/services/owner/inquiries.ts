import type { SupabaseClient } from "@supabase/supabase-js"

export type OwnerInquiryRow = {
  id: string
  message: string
  status: string | null
  created_at: string | null
  venue_id: string | null
  venue_name: string
  user_id: string | null
}

export async function fetchOwnerInquiries(
  client: SupabaseClient,
  ownerId: string
): Promise<OwnerInquiryRow[]> {
  const { data: venuesData, error: venuesError } = await client
    .from("venues")
    .select("id, name")
    .eq("owner_id", ownerId)

  if (venuesError) {
    console.error(venuesError)
    throw new Error("Failed to fetch owner venues for inquiries")
  }

  const venues = (venuesData ?? []) as Array<{ id: string; name: string | null }>
  const venueIds = venues.map((venue) => venue.id)
  const venueNameMap = new Map(venues.map((venue) => [venue.id, venue.name ?? "Unknown venue"]))

  if (venueIds.length === 0) return []

  const { data, error } = await client
    .from("inquiries")
    .select("id, message, status, created_at, venue_id, user_id")
    .in("venue_id", venueIds)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch owner inquiries")
  }

  const inquiries =
    (data as Array<{
      id: string
      message: string
      status: string | null
      created_at: string | null
      venue_id: string | null
      user_id: string | null
    }> | null) ?? []

  return inquiries.map((inquiry) => ({
    ...inquiry,
    venue_name: inquiry.venue_id
      ? venueNameMap.get(inquiry.venue_id) ?? "Unknown venue"
      : "Unknown venue",
  }))
}