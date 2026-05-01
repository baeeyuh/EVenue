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
  check_in_time?: string | null
  check_out_time?: string | null
  allow_custom_hours?: boolean | null
  allow_half_day?: boolean | null
  hourly_rate?: number | null
  half_day_price?: number | null
}

export type VenueGalleryRow = {
  venue_id: string
  name: string | null
  image: string | null
}

type VenueRpcRow = VenueDetailsRow & {
  created_at: string | null
}

type VenueQueryResult = {
  data: unknown
  error: { message?: string } | null
}

type VenuePricingRules = Pick<
  VenueDetailsRow,
  "check_in_time" | "check_out_time" | "allow_custom_hours" | "allow_half_day" | "hourly_rate" | "half_day_price"
>

const VENUE_DETAILS_SELECT =
  "id, organization_id, organization_name, name, location, capacity, price, image, rating, review_count, description, additional_info, amenities, venue_type, is_available, check_in_time, check_out_time, allow_custom_hours, allow_half_day, hourly_rate, half_day_price"
const VENUE_DETAILS_SELECT_WITH_CREATED_AT = `${VENUE_DETAILS_SELECT}, created_at`
const VENUE_DETAILS_SELECT_LEGACY =
  "id, organization_id, organization_name, name, location, capacity, price, image, rating, review_count, description, additional_info, amenities, venue_type, is_available"
const VENUE_DETAILS_SELECT_LEGACY_WITH_CREATED_AT = `${VENUE_DETAILS_SELECT_LEGACY}, created_at`

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

async function fetchVenueTimeMap(venueIds: string[]) {
  if (venueIds.length === 0) {
    return new Map<string, VenuePricingRules>()
  }

  const { data, error } = await supabaseServer
    .from("venues")
    .select("id, check_in_time, check_out_time, allow_custom_hours, allow_half_day, hourly_rate, half_day_price")
    .in("id", venueIds)

  if (error) {
    const errorText = `${String((error as { message?: string } | null)?.message ?? "")}`
    if (!/check_in_time|check_out_time|schema cache|column/i.test(errorText)) {
      console.error(error)
    }
    return new Map<string, VenuePricingRules>()
  }

  return new Map(
    ((data ?? []) as Array<{
      id: string
      check_in_time: string | null
      check_out_time: string | null
      allow_custom_hours: boolean | null
      allow_half_day: boolean | null
      hourly_rate: number | null
      half_day_price: number | null
    }>).map(
      (venue) => [
        venue.id,
        {
          check_in_time: venue.check_in_time,
          check_out_time: venue.check_out_time,
          allow_custom_hours: venue.allow_custom_hours,
          allow_half_day: venue.allow_half_day,
          hourly_rate: venue.hourly_rate,
          half_day_price: venue.half_day_price,
        },
      ],
    ),
  )
}

export async function fetchVenues(filters: Partial<VenueFilters> = {}): Promise<Venue[]> {
  const resolved = { ...DEFAULT_VENUE_FILTERS, ...filters }

  let viewQuery = supabaseServer
    .from("venue_full_details")
    .select(VENUE_DETAILS_SELECT_WITH_CREATED_AT)
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

  let viewResult: VenueQueryResult = await viewQuery.order("created_at", { ascending: false })

  if (viewResult.error) {
    const errorText = `${String((viewResult.error as { message?: string } | null)?.message ?? "")}`
    const isMissingTimeColumns = /check_in_time|check_out_time|schema cache|column/i.test(errorText)

    if (!isMissingTimeColumns) {
      console.error(viewResult.error)
      throw new Error("Failed to fetch venues")
    }

    let legacyViewQuery = supabaseServer
      .from("venue_full_details")
      .select(VENUE_DETAILS_SELECT_LEGACY_WITH_CREATED_AT)
      .gte("price", resolved.minBudget)
      .lte("price", resolved.maxBudget)
      .gte("capacity", resolved.minPax)
      .lte("capacity", resolved.maxPax)

    if (resolved.location) {
      legacyViewQuery = legacyViewQuery.ilike("location", `%${resolved.location}%`)
    }

    if (resolved.search) {
      const escapedSearch = resolved.search.replace(/,/g, "")
      legacyViewQuery = legacyViewQuery.or(`name.ilike.%${escapedSearch}%,location.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`)
    }

    if (resolved.amenities.length > 0) {
      legacyViewQuery = legacyViewQuery.contains("amenities", resolved.amenities)
    }

    viewResult = await legacyViewQuery.order("created_at", { ascending: false })

    if (viewResult.error) {
      console.error(viewResult.error)
      throw new Error("Failed to fetch venues")
    }
  }

  const venueRows: VenueRpcRow[] = (viewResult.data ?? []) as VenueRpcRow[]
  const venueTimeMap = await fetchVenueTimeMap(venueRows.map((venue) => venue.id))

  return venueRows.map((venue) => {
    const organizationName = venue.organization_name ?? ""
    const venueTimes = venueTimeMap.get(venue.id)

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
      checkInTime: venue.check_in_time ?? venueTimes?.check_in_time ?? undefined,
      checkOutTime: venue.check_out_time ?? venueTimes?.check_out_time ?? undefined,
      allowCustomHours: venue.allow_custom_hours ?? venueTimes?.allow_custom_hours ?? false,
      allowHalfDay: venue.allow_half_day ?? venueTimes?.allow_half_day ?? false,
      hourlyRate: venue.hourly_rate ?? venueTimes?.hourly_rate ?? undefined,
      halfDayPrice: venue.half_day_price ?? venueTimes?.half_day_price ?? undefined,
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
    .select(VENUE_DETAILS_SELECT)
    .eq("organization_id", id)

  if (!fullResult.error) {
    const venues = (fullResult.data as VenueDetailsRow[] | null) ?? []
    const venueTimeMap = await fetchVenueTimeMap(venues.map((venue) => venue.id))
    return venues.map((venue) => ({
      ...venue,
      check_in_time: venue.check_in_time ?? venueTimeMap.get(venue.id)?.check_in_time ?? null,
      check_out_time: venue.check_out_time ?? venueTimeMap.get(venue.id)?.check_out_time ?? null,
      allow_custom_hours: venue.allow_custom_hours ?? venueTimeMap.get(venue.id)?.allow_custom_hours ?? false,
      allow_half_day: venue.allow_half_day ?? venueTimeMap.get(venue.id)?.allow_half_day ?? false,
      hourly_rate: venue.hourly_rate ?? venueTimeMap.get(venue.id)?.hourly_rate ?? null,
      half_day_price: venue.half_day_price ?? venueTimeMap.get(venue.id)?.half_day_price ?? null,
    }))
  }

  const errorText = `${String((fullResult.error as { message?: string } | null)?.message ?? "")}`
  const isMissingColumns = /column|amenities|additional_info|schema cache/i.test(errorText)
  const isMissingTimeColumns = /check_in_time|check_out_time|schema cache|column/i.test(errorText)

  if (isMissingTimeColumns) {
    const legacyViewResult = await supabaseServer
      .from("venue_full_details")
      .select(VENUE_DETAILS_SELECT_LEGACY)
      .eq("organization_id", id)

    if (!legacyViewResult.error) {
      const venues = (legacyViewResult.data as VenueDetailsRow[] | null) ?? []
      const venueTimeMap = await fetchVenueTimeMap(venues.map((venue) => venue.id))
      return venues.map((venue) => ({
        ...venue,
        check_in_time: venueTimeMap.get(venue.id)?.check_in_time ?? null,
        check_out_time: venueTimeMap.get(venue.id)?.check_out_time ?? null,
        allow_custom_hours: venueTimeMap.get(venue.id)?.allow_custom_hours ?? false,
        allow_half_day: venueTimeMap.get(venue.id)?.allow_half_day ?? false,
        hourly_rate: venueTimeMap.get(venue.id)?.hourly_rate ?? null,
        half_day_price: venueTimeMap.get(venue.id)?.half_day_price ?? null,
      }))
    }
  }

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
    status: "pending",
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
