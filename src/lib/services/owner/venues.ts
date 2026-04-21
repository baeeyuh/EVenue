import type { SupabaseClient } from "@supabase/supabase-js"
import { getOwnerOrgIds } from "@/lib/services/owner/organizations"

const OWNER_VENUE_SELECT_FULL =
  "id, name, location, capacity, is_available, venue_type, image, price, description, amenities, additional_info"
const OWNER_VENUE_SELECT_LEGACY =
  "id, name, location, capacity, is_available, venue_type, image, price, description"

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown }
  const text = `${String(maybeError.message ?? "")} ${String(maybeError.details ?? "")} ${String(maybeError.hint ?? "")}`

  return /column|amenities|additional_info|schema cache/i.test(text)
}

export type OwnerVenueRow = {
  id: string
  name: string
  location: string | null
  capacity: number | null
  is_available: boolean | null
  venue_type: string | null
  image: string | null
  price: number | null
  description: string | null
  amenities: string[] | null
  additional_info: string | null
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
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export async function fetchOwnerVenues(
  client: SupabaseClient,
  ownerId: string
): Promise<OwnerVenueRow[]> {
  const orgIds = await getOwnerOrgIds(client, ownerId)

  if (orgIds.length === 0) return []

  const { data, error } = await client
    .from("venues")
    .select(OWNER_VENUE_SELECT_FULL)
    .in("organization_id", orgIds)
    .order("name", { ascending: true })

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error(error)
      throw new Error("Failed to fetch owner venues")
    }

    const legacyResult = await client
      .from("venues")
      .select(OWNER_VENUE_SELECT_LEGACY)
      .in("organization_id", orgIds)
      .order("name", { ascending: true })

    if (legacyResult.error) {
      console.error(legacyResult.error)
      throw new Error("Failed to fetch owner venues")
    }

    return ((legacyResult.data as OwnerVenueRow[] | null) ?? []).map((venue) => ({
      ...venue,
      amenities: null,
      additional_info: null,
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

  const { data, error } = await client
    .from("venues")
    .insert({
      id: crypto.randomUUID(),
      organization_id: orgIds[0],
      name,
      location: normalizeOptionalText(payload.location),
      capacity: typeof payload.capacity === "number" ? payload.capacity : null,
  price: typeof payload.price === "number" ? payload.price : null,
  image: normalizeOptionalText(payload.image),
  description: normalizeOptionalText(payload.description),
      amenities: Array.isArray(payload.amenities) ? payload.amenities : [],
      additional_info: normalizeOptionalText(payload.additionalInfo),
      venue_type: normalizeOptionalText(payload.venueType),
      is_available: payload.isAvailable ?? true,
      rating: 0,
      review_count: 0,
    })
    .select(OWNER_VENUE_SELECT_FULL)
    .single()

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error(error)
      throw new Error("Failed to create venue")
    }

    const legacyInsert = await client
      .from("venues")
      .insert({
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
      })
      .select(OWNER_VENUE_SELECT_LEGACY)
      .single()

    if (legacyInsert.error) {
      console.error(legacyInsert.error)
      throw new Error("Failed to create venue")
    }

    return {
      ...(legacyInsert.data as OwnerVenueRow),
      amenities: null,
      additional_info: null,
    }
  }

  return data as OwnerVenueRow
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

  const updates: Record<string, string | number | boolean | string[] | null> = {
    name: payload.name.trim(),
    location: normalizeOptionalText(payload.location),
    capacity: typeof payload.capacity === "number" ? payload.capacity : null,
    price: typeof payload.price === "number" ? payload.price : null,
    image: normalizeOptionalText(payload.image),
    description: normalizeOptionalText(payload.description),
    amenities: Array.isArray(payload.amenities) ? payload.amenities : [],
    additional_info: normalizeOptionalText(payload.additionalInfo),
    venue_type: normalizeOptionalText(payload.venueType),
    is_available: payload.isAvailable ?? true,
  }

  const { data, error } = await client
    .from("venues")
    .update(updates)
    .eq("id", venueId)
    .in("organization_id", orgIds)
    .select(OWNER_VENUE_SELECT_FULL)
    .single()

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error(error)
      throw new Error("Failed to update venue")
    }

    const legacyUpdates: Record<string, string | number | boolean | null> = {
      name: payload.name.trim(),
      location: normalizeOptionalText(payload.location),
      capacity: typeof payload.capacity === "number" ? payload.capacity : null,
      price: typeof payload.price === "number" ? payload.price : null,
      image: normalizeOptionalText(payload.image),
      description: normalizeOptionalText(payload.description),
      venue_type: normalizeOptionalText(payload.venueType),
      is_available: payload.isAvailable ?? true,
    }

    const legacyUpdate = await client
      .from("venues")
      .update(legacyUpdates)
      .eq("id", venueId)
      .in("organization_id", orgIds)
      .select(OWNER_VENUE_SELECT_LEGACY)
      .single()

    if (legacyUpdate.error) {
      console.error(legacyUpdate.error)
      throw new Error("Failed to update venue")
    }

    return {
      ...(legacyUpdate.data as OwnerVenueRow),
      amenities: null,
      additional_info: null,
    }
  }

  return data as OwnerVenueRow
}