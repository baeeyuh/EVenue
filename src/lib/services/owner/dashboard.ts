import type { SupabaseClient } from "@supabase/supabase-js"

export type OwnerDashboardSummary = {
  totalVenues: number
  pendingInquiries: number
  upcomingBookings: number
  estimatedRevenue: number
}

export async function fetchOwnerDashboardSummary(
  client: SupabaseClient,
  ownerId: string
): Promise<OwnerDashboardSummary> {
  const { count: venueCount } = await client
    .from("venues")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", ownerId)

  const { data: ownerVenueIdsData } = await client
    .from("venues")
    .select("id")
    .eq("owner_id", ownerId)

  const venueIds = (ownerVenueIdsData ?? []).map((venue) => venue.id)

  let pendingInquiries = 0
  let upcomingBookings = 0
  let estimatedRevenue = 0

  if (venueIds.length > 0) {
    const { count: inquiryCount } = await client
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .in("venue_id", venueIds)
      .eq("status", "Pending")

    pendingInquiries = inquiryCount ?? 0

    const { data: bookingsData } = await client
      .from("bookings")
      .select("price, status")
      .in("venue_id", venueIds)
      .eq("status", "Confirmed")

    upcomingBookings = bookingsData?.length ?? 0
    estimatedRevenue =
      bookingsData?.reduce((sum, booking) => sum + Number(booking.price ?? 0), 0) ?? 0
  }

  return {
    totalVenues: venueCount ?? 0,
    pendingInquiries,
    upcomingBookings,
    estimatedRevenue,
  }
}