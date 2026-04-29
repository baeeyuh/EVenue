import { supabaseServer } from "@/lib/supabaseServer"
import type { Venue } from "@/types/types"
import { DEFAULT_VENUE_FILTERS, type VenueFilters } from "@/lib/venue-filters"

export type VenueDetailsRow = {
  id: string
  organization_id: string | null
  organization_name: string | null
  name: string
  location: string | null
  capacity: number | null
  price: number | null
  image: string | null
  rating: number | null
  review_count: number | null
  description: string | null
  additional_info: string | null
  amenities: string[] | null
  venue_type: string | null
  is_available: boolean | null
}

export type VenueGalleryRow = {
  venue_id: string
  name: string | null
  image: string | null
}

type VenueRpcRow = VenueDetailsRow & {
  created_at: string | null
}

export type AvailabilityRequestPayload = {
  venueId: string
  eventDate: string
  startTime?: string
  endTime?: string
  guestCount?: number
  eventType?: string
  notes?: string
}

export type VenueInquiryPayload = {
  userId: string
  venueId: string
  fullName: string
  email: string
  contactNumber?: string
  eventDate: string
  guestCount?: number
  eventType?: string
  message: string
}

function organizationInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export async function fetchVenues(filters: Partial<VenueFilters> = {}): Promise<Venue[]> {
  const resolved = { ...DEFAULT_VENUE_FILTERS, ...filters }

  let viewQuery = supabaseServer
    .from("venue_full_details")
    .select("id, organization_id, organization_name, name, location, capacity, price, image, rating, review_count, description, additional_info, amenities, venue_type, is_available, created_at")
    .gte("price", resolved.minBudget)
    .lte("price", resolved.maxBudget)
    .gte("capacity", resolved.minPax)
    .lte("capacity", resolved.maxPax)

  if (resolved.location) {
    viewQuery = viewQuery.ilike("location", `%${resolved.location}%`)
  }

  if (resolved.search) {
    const escapedSearch = resolved.search.replace(/,/g, "")
    viewQuery = viewQuery.or(`name.ilike.%${escapedSearch}%,location.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`)
  }

  if (resolved.amenities.length > 0) {
    viewQuery = viewQuery.contains("amenities", resolved.amenities)
  }

  const viewResult = await viewQuery.order("created_at", { ascending: false })

  if (viewResult.error) {
    console.error(viewResult.error)
    throw new Error("Failed to fetch venues")
  }

  const venueRows: VenueRpcRow[] = (viewResult.data ?? []) as VenueRpcRow[]

  return venueRows.map((venue) => {
    const organizationName = venue.organization_name ?? ""

    return {
      id: venue.id,
      organizationId: venue.organization_id ?? "",
      name: venue.name,
      organizationName: organizationName || undefined,
      location: venue.location ?? "",
      capacity: venue.capacity ?? 0,
      price: venue.price !== null ? `₱${Number(venue.price).toLocaleString()}` : "Price on request",
      image: venue.image ?? "",
      amenities: venue.amenities ?? [],
      rating: Number(venue.rating ?? 0),
      reviewCount: venue.review_count ?? 0,
      ownerName: organizationName || "Venue Owner",
      ownerInitials: organizationName ? organizationInitials(organizationName) : "VO",
      description: venue.description ?? undefined,
      additionalInfo: venue.additional_info ?? undefined,
      venueType: venue.venue_type ?? undefined,
      isAvailable: venue.is_available ?? true,
    }
  })
}

export async function fetchFeaturedVenues(): Promise<Venue[]> {
  try {
    return await fetchVenues()
  } catch {
    return []
  }
}

export async function fetchVenuesByOrganizationId(id: string): Promise<VenueDetailsRow[]> {
  const fullResult = await supabaseServer
    .from("venue_full_details")
    .select("id, organization_id, organization_name, name, location, capacity, price, image, rating, review_count, description, additional_info, amenities, venue_type, is_available")
    .eq("organization_id", id)

  if (!fullResult.error) {
    return (fullResult.data as VenueDetailsRow[] | null) ?? []
  }

  const errorText = `${String((fullResult.error as { message?: string } | null)?.message ?? "")}`
  const isMissingColumns = /column|amenities|additional_info|schema cache/i.test(errorText)

  if (!isMissingColumns) {
    console.error(fullResult.error)
    return []
  }

  const legacyResult = await supabaseServer
    .from("venues")
    .select("id, organization_id, name, location, capacity, price, image, rating, review_count, description, venue_type, is_available")
    .eq("organization_id", id)

  if (legacyResult.error) {
    console.error(legacyResult.error)
    return []
  }

  return ((legacyResult.data as VenueDetailsRow[] | null) ?? []).map((venue) => ({
    ...venue,
    organization_name: null,
    amenities: null,
    additional_info: null,
  }))
}

export async function createAvailabilityRequest(payload: AvailabilityRequestPayload) {
  const { error } = await supabaseServer.from("venue_availability_requests").insert({
    venue_id: payload.venueId,
    event_date: payload.eventDate,
    start_time: payload.startTime ?? null,
    end_time: payload.endTime ?? null,
    guest_count: payload.guestCount ?? null,
    event_type: payload.eventType ?? null,
    notes: payload.notes ?? null,
    status: "Pending",
  })

  if (error) {
    console.error(error)
    throw new Error("Failed to submit availability request")
  }

  return { success: true }
}

export async function createVenueInquiry(payload: VenueInquiryPayload) {
  const metaParts = [
    `Venue: ${payload.venueId}`,
    `Event date: ${payload.eventDate}`,
    payload.eventType ? `Event type: ${payload.eventType}` : null,
    payload.guestCount ? `Guest count: ${payload.guestCount}` : null,
    payload.contactNumber ? `Contact number: ${payload.contactNumber}` : null,
    payload.email ? `Email: ${payload.email}` : null,
    payload.fullName ? `Full name: ${payload.fullName}` : null,
    "",
    "Message:",
    payload.message,
  ]

  const composedMessage = metaParts.filter(Boolean).join("\n")

  const { error } = await supabaseServer.from("inquiries").insert({
    id: crypto.randomUUID(),
    user_id: payload.userId,
    venue_id: payload.venueId,
    message: composedMessage,
    status: "Pending",
  })

  if (error) {
    console.error(error)
    throw new Error("Failed to send inquiry")
  }

  return { success: true }
}

export async function fetchVenueGalleryByVenueIds(venueIds: string[]): Promise<string[]> {
  if (venueIds.length === 0) return []

  const { data, error } = await supabaseServer
    .from("venue_gallery_view")
    .select("venue_id, name, image")
    .in("venue_id", venueIds)
    .order("name", { ascending: true })

  if (error) {
    console.error(error)
    return []
  }

  return ((data ?? []) as VenueGalleryRow[])
    .map((row) => row.image)
    .filter((image): image is string => typeof image === "string" && image.trim().length > 0)
}