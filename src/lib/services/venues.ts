import { supabaseServer } from "@/lib/supabaseServer"
import { headers } from "next/headers"
import type { Venue } from "@/types/types"

type VenueRow = {
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

export async function fetchVenues(): Promise<Venue[]> {
  const { data, error } = await supabaseServer
    .from("venues")
    .select("id, organization_id, name, location, capacity, price, image, rating, review_count, description, venue_type, is_available")
    .limit(10)

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch venues")
  }

  return ((data ?? []) as VenueRow[]).map((venue) => ({
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
    const requestHeaders = await headers()
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")

    if (!host) return []

    const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https")
    const response = await fetch(`${protocol}://${host}/api/venues`, { cache: "no-store" })

    if (!response.ok) return []

    return (await response.json()) as Venue[]
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