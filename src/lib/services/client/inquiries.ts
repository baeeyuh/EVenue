import type { SupabaseClient } from "@supabase/supabase-js"

export type ClientInquiryRow = {
  id: string
  status: string | null
  message: string
  created_at: string | null
  venue_id: string | null
  venue_name: string
}

type InquiryBaseRow = {
  id: string
  status: string | null
  message: string
  created_at: string | null
  venue_id: string | null
}

async function buildVenueNameMap(
  client: SupabaseClient,
  venueIds: string[]
): Promise<Map<string, string>> {
  if (venueIds.length === 0) {
    return new Map()
  }

  const { data: venuesData, error: venuesError } = await client
    .from("venues")
    .select("id, name")
    .in("id", venueIds)

  if (venuesError) {
    console.error(venuesError)
    return new Map()
  }

  return new Map(
    ((venuesData ?? []) as Array<{ id: string; name: string | null }>).map(
      (venue) => [venue.id, venue.name ?? "Unknown venue"]
    )
  )
}

export async function fetchClientInquiries(
  client: SupabaseClient,
  userId: string
): Promise<ClientInquiryRow[]> {
  const { data: inquiriesData, error: inquiriesError } = await client
    .from("inquiries")
    .select("id, status, message, created_at, venue_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (inquiriesError) {
    console.error(inquiriesError)
    throw new Error("Failed to fetch client inquiries")
  }

  const inquiries = (inquiriesData ?? []) as InquiryBaseRow[]

  const venueIds = Array.from(
    new Set(inquiries.map((inquiry) => inquiry.venue_id).filter(Boolean))
  ) as string[]

  const venueNameMap = await buildVenueNameMap(client, venueIds)

  return inquiries.map((inquiry) => ({
    ...inquiry,
    venue_name: inquiry.venue_id
      ? venueNameMap.get(inquiry.venue_id) ?? "Unknown venue"
      : "Unknown venue",
  }))
}

export async function fetchClientInquiryById(
  client: SupabaseClient,
  userId: string,
  inquiryId: string
): Promise<ClientInquiryRow | null> {
  const { data, error } = await client
    .from("inquiries")
    .select("id, status, message, created_at, venue_id")
    .eq("user_id", userId)
    .eq("id", inquiryId)
    .maybeSingle()

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch inquiry")
  }

  if (!data) {
    return null
  }

  const inquiry = data as InquiryBaseRow
  const venueIds = inquiry.venue_id ? [inquiry.venue_id] : []
  const venueNameMap = await buildVenueNameMap(client, venueIds)

  return {
    ...inquiry,
    venue_name: inquiry.venue_id
      ? venueNameMap.get(inquiry.venue_id) ?? "Unknown venue"
      : "Unknown venue",
  }
}