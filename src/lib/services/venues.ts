import { supabaseServer } from "@/lib/supabaseServer"
import type { Venue } from "@/types/types"
import { DEFAULT_VENUE_FILTERS, type VenueFilters } from "@/lib/venue-filters"

export type VenueDetailsRow = {
  id: string
  organization_id: string | null
  name: string
  location: string | null
  capacity: number | null
  price: number | null
  image: string | null
  rating: number | null
  review_count: number | null
  description: string | null
  venue_type: string | null
  is_available: boolean | null
}

type VenueRpcRow = VenueDetailsRow & {
  created_at: string | null
}

export async function fetchVenues(filters: Partial<VenueFilters> = {}): Promise<Venue[]> {
  const resolved = { ...DEFAULT_VENUE_FILTERS, ...filters }

  const { data, error } = await supabaseServer.rpc("filter_venues", {
    min_budget: resolved.minBudget,
    max_budget: resolved.maxBudget,
    min_pax: resolved.minPax,
    max_pax: resolved.maxPax,
    location_param: resolved.location || null,
    search: resolved.search || null,
    amenities: resolved.amenities.length > 0 ? resolved.amenities : null,
  })

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch venues")
  }

  return ((data ?? []) as VenueRpcRow[]).map((venue) => ({
    id: venue.id,
    organizationId: venue.organization_id ?? "",
    name: venue.name,
    location: venue.location ?? "",
    capacity: venue.capacity ?? 0,
    price: venue.price !== null ? `₱${Number(venue.price).toLocaleString()}` : "Price on request",
    image: venue.image ?? "",
    amenities: [],
    rating: Number(venue.rating ?? 0),
    reviewCount: venue.review_count ?? 0,
    ownerName: "Venue Owner",
    ownerInitials: "VO",
    description: venue.description ?? undefined,
    venueType: venue.venue_type ?? undefined,
    isAvailable: venue.is_available ?? true,
  }))
}

export async function fetchFeaturedVenues(): Promise<Venue[]> {
  try {
    return await fetchVenues()
  } catch {
    return []
  }
}

export async function fetchVenuesByOrganizationId(id: string): Promise<VenueDetailsRow[]> {
  const { data, error } = await supabaseServer
    .from("venues")
    .select("id, organization_id, name, location, capacity, price, image, rating, review_count, description, venue_type, is_available")
    .eq("organization_id", id)

  if (error) {
    console.error(error)
    return []
  }

  return (data as VenueDetailsRow[] | null) ?? []
}