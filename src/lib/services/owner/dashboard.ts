import type { SupabaseClient } from "@supabase/supabase-js"
import { getOwnerOrgIds } from "@/lib/services/owner/organizations"

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
  const orgIds = await getOwnerOrgIds(client, ownerId)

  console.log("[owner-dashboard] ownerId:", ownerId)
  console.log("[owner-dashboard] orgIds:", orgIds)

  if (orgIds.length === 0) {
    return {
      totalVenues: 0,
      pendingInquiries: 0,
      upcomingBookings: 0,
      estimatedRevenue: 0,
    }
  }

  // 1. venues count (still needed separately unless you add it to view)
  const { count: venueCount, error: venueError } = await client
    .from("venues")
    .select("*", { count: "exact", head: true })
    .in("organization_id", orgIds)

  if (venueError) {
    throw new Error("Failed to fetch venues")
  }
const { data, error } = await client
  .from("org_dashboard_summary")
  .select("*")
  .in("organization_id", orgIds)

if (error) throw error

console.log("[owner-dashboard] org_dashboard_summary rows:", data)

const summary = (data ?? []).reduce(
  (acc, row) => {
    acc.pendingInquiries += Number(row.pending_inquiries ?? 0)
    acc.upcomingBookings += Number(row.upcoming_bookings ?? 0)
    acc.estimatedRevenue += Number(row.estimated_revenue ?? 0)
    return acc
  },
  {
    pendingInquiries: 0,
    upcomingBookings: 0,
    estimatedRevenue: 0,
  }
)

return {
  totalVenues: venueCount ?? 0,
  ...summary,
}
}