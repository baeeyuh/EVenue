import type { SupabaseClient } from "@supabase/supabase-js"

import { getOwnerOrgIds } from "@/lib/services/owner/organizations"

export type NotificationCounts = {
  inquiries: number
  bookings: number
}

function getExactCount(count: number | null): number {
  return typeof count === "number" ? count : 0
}

export async function fetchClientNotificationCounts(
  client: SupabaseClient,
  userId: string,
): Promise<NotificationCounts> {
  const [inquiriesResult, bookingsResult] = await Promise.all([
    client
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["accepted", "rejected", "responded", "declined", "closed", "Accepted", "Rejected"]),
    client
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["pending", "confirmed", "Pending", "Confirmed"]),
  ])

  if (inquiriesResult.error) {
    console.error(inquiriesResult.error)
    throw new Error("Failed to fetch notification counts")
  }

  if (bookingsResult.error) {
    console.error(bookingsResult.error)
    throw new Error("Failed to fetch notification counts")
  }

  return {
    inquiries: getExactCount(inquiriesResult.count),
    bookings: getExactCount(bookingsResult.count),
  }
}

export async function fetchOwnerNotificationCounts(
  client: SupabaseClient,
  ownerId: string,
): Promise<NotificationCounts> {
  const orgIds = await getOwnerOrgIds(client, ownerId)

  if (orgIds.length === 0) {
    return { inquiries: 0, bookings: 0 }
  }

  const venuesResult = await client
    .from("venues")
    .select("id")
    .in("organization_id", orgIds)

  if (venuesResult.error) {
    console.error(venuesResult.error)
    throw new Error("Failed to fetch notification counts")
  }

  const venueIds = ((venuesResult.data ?? []) as Array<{ id: string }>).map((venue) => venue.id)

  const inquiriesPromise = venueIds.length > 0
    ? client
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .in("venue_id", venueIds)
      .in("status", ["pending", "Pending"])
    : Promise.resolve({ count: 0, error: null })

  const [inquiriesResult, bookingsResult] = await Promise.all([
    inquiriesPromise,
    client
      .from("owner_bookings_view")
      .select("id", { count: "exact", head: true })
      .in("organization_id", orgIds)
      .in("status", ["pending", "confirmed", "Pending", "Confirmed"]),
  ])

  if (inquiriesResult.error) {
    console.error(inquiriesResult.error)
    throw new Error("Failed to fetch notification counts")
  }

  if (bookingsResult.error) {
    console.error(bookingsResult.error)
    throw new Error("Failed to fetch notification counts")
  }

  return {
    inquiries: getExactCount(inquiriesResult.count),
    bookings: getExactCount(bookingsResult.count),
  }
}
