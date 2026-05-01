import type { SupabaseClient } from "@supabase/supabase-js"
import { getOwnerOrgIds } from "@/lib/services/owner/organizations"

const OWNER_VENUE_SELECT_VIEW =
  "id, organization_id, organization_name, name, location, capacity, is_available, venue_type, image, price, rating, review_count, description, additional_info, amenities, check_in_time, check_out_time, allow_custom_hours, allow_half_day, hourly_rate, half_day_price"
const OWNER_VENUE_SELECT_LEGACY_WITH_TIMES =
  "id, organization_id, name, location, capacity, is_available, venue_type, image, price, description, check_in_time, check_out_time, allow_custom_hours, allow_half_day, hourly_rate, half_day_price"
const OWNER_VENUE_SELECT_LEGACY =
  "id, organization_id, name, location, capacity, is_available, venue_type, image, price, description"

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown }
  const text = `${String(maybeError.message ?? "")} ${String(maybeError.details ?? "")} ${String(maybeError.hint ?? "")}`

  return /column|amenities|additional_info|schema cache|relation|view/i.test(text)
}

function getMissingOptionalVenueColumn(
  error: unknown
): "additional_info" | "check_in_time" | "check_out_time" | "allow_custom_hours" | "allow_half_day" | "hourly_rate" | "half_day_price" | null {
  if (!error || typeof error !== "object") return null

  const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown }
  const text = `${String(maybeError.message ?? "")} ${String(maybeError.details ?? "")} ${String(maybeError.hint ?? "")}`.toLowerCase()

  if (!text.includes("schema cache") && !text.includes("column")) return null
  if (text.includes("additional_info")) return "additional_info"
  if (text.includes("check_in_time")) return "check_in_time"
  if (text.includes("check_out_time")) return "check_out_time"
  if (text.includes("allow_custom_hours")) return "allow_custom_hours"
  if (text.includes("allow_half_day")) return "allow_half_day"
  if (text.includes("hourly_rate")) return "hourly_rate"
  if (text.includes("half_day_price")) return "half_day_price"
  return null
}

export type OwnerVenueRow = {
  id: string
  organization_id?: string | null
  organization_name?: string | null
  name: string
  location: string | null
  capacity: number | null
  is_available: boolean | null
  venue_type: string | null
  image: string | null
  price: number | null
  rating?: number | null
  review_count?: number | null
  description: string | null
  amenities: string[] | null
  additional_info: string | null
  check_in_time?: string | null
  check_out_time?: string | null
  allow_custom_hours?: boolean | null
  allow_half_day?: boolean | null
  hourly_rate?: number | null
  half_day_price?: number | null
}

export type OwnerVenueUpsertPayload = {
  name: string
  location?: string | null
  capacity?: number | null
  price?: number | null
  image?: string | null
  description?: string | null
  amenities?: string[] | null
  additionalInfo?: string | null
  venueType?: string | null
  isAvailable?: boolean | null
  checkInTime?: string | null
  checkOutTime?: string | null
  allowCustomHours?: boolean | null
  allowHalfDay?: boolean | null
  hourlyRate?: number | null
  halfDayPrice?: number | null
}

type AmenityRow = {
  id: number
  name: string
}

type VenueQueryResult = {
  data: unknown
  error: unknown
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeAmenityName(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeAmenitiesInput(amenities: string[] | null | undefined): string[] {
  if (!Array.isArray(amenities)) return []

  const unique = new Map<string, string>()

  for (const raw of amenities) {
    if (typeof raw !== "string") continue
    const trimmed = raw.trim()
    if (!trimmed) continue

    const normalized = normalizeAmenityName(trimmed)
    if (!unique.has(normalized)) {
      unique.set(normalized, trimmed)
    }
  }

  return Array.from(unique.values())
}

async function hydrateOwnerVenueById(
  client: SupabaseClient,
  orgIds: string[],
  venueId: string,
): Promise<OwnerVenueRow> {
  const fromView = await client
    .from("venue_full_details")
    .select(OWNER_VENUE_SELECT_VIEW)
    .eq("id", venueId)
    .in("organization_id", orgIds)
    .single()

  if (!fromView.error) {
    return fromView.data as OwnerVenueRow
  }

  let fallback = await client
    .from("venues")
    .select(OWNER_VENUE_SELECT_LEGACY_WITH_TIMES)
    .eq("id", venueId)
    .in("organization_id", orgIds)
    .single()

  if (fallback.error && isMissingColumnError(fallback.error)) {
    fallback = await client
      .from("venues")
      .select(OWNER_VENUE_SELECT_LEGACY)
      .eq("id", venueId)
      .in("organization_id", orgIds)
      .single()
  }

  if (fallback.error) {
    console.error(fallback.error)
    throw new Error("Failed to fetch owner venue")
  }

  return {
    ...(fallback.data as OwnerVenueRow),
    rating: null,
    review_count: null,
    amenities: null,
    additional_info: null,
    check_in_time: null,
    check_out_time: null,
    allow_custom_hours: false,
    allow_half_day: false,
    hourly_rate: null,
    half_day_price: null,
  }
}

async function resolveAmenityIds(
  client: SupabaseClient,
  amenities: string[] | null | undefined,
): Promise<number[]> {
  const dedupedAmenities = normalizeAmenitiesInput(amenities)
  const resolvedIds: number[] = []

  for (const rawName of dedupedAmenities) {
    const normalized = normalizeAmenityName(rawName)

    const existing = await client
      .from("amenities")
      .select("id, name")
      .ilike("name", normalized)
      .maybeSingle<AmenityRow>()

    if (existing.error) {
      console.error(existing.error)
      throw new Error("Failed to resolve amenities")
    }

    if (existing.data?.id) {
      resolvedIds.push(existing.data.id)
      continue
    }

    const inserted = await client
      .from("amenities")
      .insert({
        name: rawName.trim(),
        is_custom: true,
      })
      .select("id")
      .single<{ id: number }>()

    if (!inserted.error && inserted.data?.id) {
      resolvedIds.push(inserted.data.id)
      continue
    }

    const maybeDuplicate =
      inserted.error &&
      typeof inserted.error === "object" &&
      "code" in inserted.error &&
      (inserted.error as { code?: string }).code === "23505"

    if (maybeDuplicate) {
      const afterDuplicate = await client
        .from("amenities")
        .select("id")
        .ilike("name", normalized)
        .single<{ id: number }>()

      if (afterDuplicate.error || !afterDuplicate.data?.id) {
        console.error(afterDuplicate.error)
        throw new Error("Failed to resolve amenities")
      }

      resolvedIds.push(afterDuplicate.data.id)
      continue
    }

    console.error(inserted.error)
    throw new Error("Failed to resolve amenities")
  }

  return Array.from(new Set(resolvedIds))
}

async function replaceVenueAmenities(
  client: SupabaseClient,
  venueId: string,
  amenityIds: number[],
): Promise<void> {
  const deleted = await client.from("venue_amenities").delete().eq("venue_id", venueId)

  if (deleted.error) {
    console.error(deleted.error)
    throw new Error("Failed to update venue amenities")
  }

  if (amenityIds.length === 0) return

  const inserted = await client.from("venue_amenities").insert(
    amenityIds.map((amenityId) => ({
      venue_id: venueId,
      amenity_id: amenityId,
    })),
  )

  if (inserted.error) {
    console.error(inserted.error)
    throw new Error("Failed to update venue amenities")
  }
}

export async function fetchOwnerVenues(
  client: SupabaseClient,
  ownerId: string
): Promise<OwnerVenueRow[]> {
  const orgIds = await getOwnerOrgIds(client, ownerId)

  if (orgIds.length === 0) return []

  const { data, error } = await client
    .from("venue_full_details")
    .select(OWNER_VENUE_SELECT_VIEW)
    .in("organization_id", orgIds)
    .order("name", { ascending: true })

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error(error)
      throw new Error("Failed to fetch owner venues")
    }

    let legacyResult: VenueQueryResult = await client
      .from("venues")
      .select(OWNER_VENUE_SELECT_LEGACY_WITH_TIMES)
      .in("organization_id", orgIds)
      .order("name", { ascending: true })

    if (legacyResult.error && isMissingColumnError(legacyResult.error)) {
      legacyResult = await client
        .from("venues")
        .select(OWNER_VENUE_SELECT_LEGACY)
        .in("organization_id", orgIds)
        .order("name", { ascending: true })
    }

    if (legacyResult.error) {
      console.error(legacyResult.error)
      throw new Error("Failed to fetch owner venues")
    }

    return ((legacyResult.data as OwnerVenueRow[] | null) ?? []).map((venue) => ({
      ...venue,
      rating: null,
      review_count: null,
      amenities: null,
      additional_info: null,
      check_in_time: venue.check_in_time ?? null,
      check_out_time: venue.check_out_time ?? null,
      allow_custom_hours: venue.allow_custom_hours ?? false,
      allow_half_day: venue.allow_half_day ?? false,
      hourly_rate: venue.hourly_rate ?? null,
      half_day_price: venue.half_day_price ?? null,
    }))
  }

  return (data as OwnerVenueRow[] | null) ?? []
}

export async function createOwnerVenue(
  client: SupabaseClient,
  ownerId: string,
  payload: OwnerVenueUpsertPayload
): Promise<OwnerVenueRow> {
  const orgIds = await getOwnerOrgIds(client, ownerId)

  if (orgIds.length === 0) {
    throw new Error("No organization found for this owner")
  }

  const name = payload.name.trim()

  const baseInsert = {
    id: crypto.randomUUID(),
    organization_id: orgIds[0],
    name,
    location: normalizeOptionalText(payload.location),
    capacity: typeof payload.capacity === "number" ? payload.capacity : null,
    price: typeof payload.price === "number" ? payload.price : null,
    image: normalizeOptionalText(payload.image),
    description: normalizeOptionalText(payload.description),
    venue_type: normalizeOptionalText(payload.venueType),
    is_available: payload.isAvailable ?? true,
    rating: 0,
    review_count: 0,
  }

  const optionalInsert = {
    additional_info: normalizeOptionalText(payload.additionalInfo),
    check_in_time: normalizeOptionalText(payload.checkInTime),
    check_out_time: normalizeOptionalText(payload.checkOutTime),
    allow_custom_hours: payload.allowCustomHours ?? false,
    allow_half_day: payload.allowHalfDay ?? false,
    hourly_rate: typeof payload.hourlyRate === "number" ? payload.hourlyRate : null,
    half_day_price: typeof payload.halfDayPrice === "number" ? payload.halfDayPrice : null,
  }
  const insertPayload: Record<string, string | number | boolean | null> = {
    ...baseInsert,
    ...optionalInsert,
  }

  let { data, error } = await client
    .from("venues")
    .insert(insertPayload)
    .select("id, organization_id")
    .single()

  while (error) {
    const missingColumn = getMissingOptionalVenueColumn(error)
    if (!missingColumn || !(missingColumn in insertPayload)) break

    delete insertPayload[missingColumn]
    const fallbackInsert = await client
      .from("venues")
      .insert(insertPayload)
      .select("id, organization_id")
      .single()

    data = fallbackInsert.data
    error = fallbackInsert.error
  }

  if (error) {
    console.error(error)
    throw new Error("Failed to create venue")
  }

  const insertedVenue = data as { id: string; organization_id: string }
  const amenityIds = await resolveAmenityIds(client, payload.amenities)
  await replaceVenueAmenities(client, insertedVenue.id, amenityIds)

  return await hydrateOwnerVenueById(client, orgIds, insertedVenue.id)
}

export async function updateOwnerVenue(
  client: SupabaseClient,
  ownerId: string,
  venueId: string,
  payload: OwnerVenueUpsertPayload
): Promise<OwnerVenueRow> {
  const orgIds = await getOwnerOrgIds(client, ownerId)

  if (orgIds.length === 0) {
    throw new Error("No organization found for this owner")
  }

  let updates: Record<string, string | number | boolean | null> = {
    name: payload.name.trim(),
    location: normalizeOptionalText(payload.location),
    capacity: typeof payload.capacity === "number" ? payload.capacity : null,
    price: typeof payload.price === "number" ? payload.price : null,
    image: normalizeOptionalText(payload.image),
    description: normalizeOptionalText(payload.description),
    additional_info: normalizeOptionalText(payload.additionalInfo),
    venue_type: normalizeOptionalText(payload.venueType),
    is_available: payload.isAvailable ?? true,
    check_in_time: normalizeOptionalText(payload.checkInTime),
    check_out_time: normalizeOptionalText(payload.checkOutTime),
    allow_custom_hours: payload.allowCustomHours ?? false,
    allow_half_day: payload.allowHalfDay ?? false,
    hourly_rate: typeof payload.hourlyRate === "number" ? payload.hourlyRate : null,
    half_day_price: typeof payload.halfDayPrice === "number" ? payload.halfDayPrice : null,
  }

  let { data, error } = await client
    .from("venues")
    .update(updates)
    .eq("id", venueId)
    .in("organization_id", orgIds)
    .select("id, organization_id")
    .single()

  while (error) {
    const missingColumn = getMissingOptionalVenueColumn(error)
    if (!missingColumn || !(missingColumn in updates)) break

    updates = { ...updates }
    delete updates[missingColumn]
    const fallbackUpdate = await client
      .from("venues")
      .update(updates)
      .eq("id", venueId)
      .in("organization_id", orgIds)
      .select("id, organization_id")
      .single()

    data = fallbackUpdate.data
    error = fallbackUpdate.error
  }

  if (error) {
    console.error(error)
    throw new Error("Failed to update venue")
  }

  const updatedVenue = data as { id: string; organization_id: string }
  const amenityIds = await resolveAmenityIds(client, payload.amenities)
  await replaceVenueAmenities(client, updatedVenue.id, amenityIds)

  return await hydrateOwnerVenueById(client, orgIds, updatedVenue.id)
}

export async function deleteOwnerVenue(
  client: SupabaseClient,
  ownerId: string,
  venueId: string,
): Promise<void> {
  const orgIds = await getOwnerOrgIds(client, ownerId)

  if (orgIds.length === 0) {
    throw new Error("No organization found for this owner")
  }

  const venueLookup = await client
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .in("organization_id", orgIds)
    .maybeSingle()

  if (venueLookup.error) {
    console.error(venueLookup.error)
    throw new Error("Failed to verify venue ownership")
  }

  if (!venueLookup.data) {
    throw new Error("Venue not found")
  }

  const amenityDelete = await client.from("venue_amenities").delete().eq("venue_id", venueId)

  if (amenityDelete.error) {
    console.error(amenityDelete.error)
    throw new Error("Failed to delete venue amenities")
  }

  const venueDelete = await client
    .from("venues")
    .delete()
    .eq("id", venueId)
    .in("organization_id", orgIds)

  if (venueDelete.error) {
    console.error(venueDelete.error)
    throw new Error("Failed to delete venue")
  }
}
