import type { SupabaseClient } from "@supabase/supabase-js"

export type ClientInquiryRow = {
  id: string
  status: string | null
  message: string
  created_at: string | null
  venue_id: string | null
  venue_name: string
}

export async function fetchClientInquiries(client: SupabaseClient, userId: string): Promise<ClientInquiryRow[]> {
  const { data: inquiriesData, error: inquiriesError } = await client
    .from("inquiries")
    .select("id, status, message, created_at, venue_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (inquiriesError) {
    console.error(inquiriesError)
    throw new Error("Failed to fetch client inquiries")
  }

  let inquiries = (inquiriesData ?? []) as Array<{
    id: string
    status: string | null
    message: string
    created_at: string | null
    venue_id: string | null
  }>

  if (inquiries.length === 0 && process.env.NODE_ENV !== "production") {
    const { data: fallbackInquiriesData, error: fallbackInquiriesError } = await client
      .from("inquiries")
      .select("id, status, message, created_at, venue_id")
      .order("created_at", { ascending: false })
      .limit(20)

    if (!fallbackInquiriesError && fallbackInquiriesData) {
      inquiries = fallbackInquiriesData as typeof inquiries
    }
  }

  const venueIds = Array.from(new Set(inquiries.map((inquiry) => inquiry.venue_id).filter(Boolean))) as string[]

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

  return inquiries.map((inquiry) => ({
    ...inquiry,
    venue_name: inquiry.venue_id ? venueNameMap.get(inquiry.venue_id) ?? "Unknown venue" : "Unknown venue",
  }))
}
