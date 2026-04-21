import type { SupabaseClient } from "@supabase/supabase-js"
import { getOwnerOrgIds } from "@/lib/services/owner/organizations"

const OWNER_VENUE_SELECT_VIEW =
  "id, organization_id, name, location, capacity, is_available, venue_type, image, price, description, amenities"
const OWNER_VENUE_SELECT_WITH_ADDITIONAL_INFO =
  "id, organization_id, name, location, capacity, is_available, venue_type, image, price, description, additional_info"
const OWNER_VENUE_SELECT_LEGACY =
  "id, organization_id, name, location, capacity, is_available, venue_type, image, price, description"

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown }
  const text = `${String(maybeError.message ?? "")} ${String(maybeError.details ?? "")} ${String(maybeError.hint ?? "")}`

  return /column|amenities|additional_info|schema cache|relation|view/i.test(text)
}

export type OwnerVenueRow = {
  id: string
  organization_id?: string | null
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

type AmenityRow = {
  id: number
  name: string
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

function isAdditionalInfoMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown }
  const text = `${String(maybeError.message ?? "")} ${String(maybeError.details ?? "")} ${String(maybeError.hint ?? "")}`.toLowerCase()

  return text.includes("additional_info") && text.includes("schema cache")
}

async function hydrateOwnerVenueById(
  client: SupabaseClient,
  orgIds: string[],
  venueId: string,
): Promise<OwnerVenueRow> {
  const fromView = await client
    .from("venue_with_amenities")
    .select(OWNER_VENUE_SELECT_VIEW)
    .eq("id", venueId)
    .in("organization_id", orgIds)
    .single()

  if (!fromView.error) {
    const fromVenues = await client
      .from("venues")
      .select("id, additional_info")
      .eq("id", venueId)
      .in("organization_id", orgIds)
      .maybeSingle<{ id: string; additional_info: string | null }>()

    return {
      ...(fromView.data as OwnerVenueRow),
      additional_info: fromVenues.data?.additional_info ?? null,
    }
  }

  const fallback = await client
    .from("venues")
    .select(OWNER_VENUE_SELECT_LEGACY)
    .eq("id", venueId)
    .in("organization_id", orgIds)
    .single()

  if (fallback.error) {
    console.error(fallback.error)
    throw new Error("Failed to fetch owner venue")
  }

  return {
    ...(fallback.data as OwnerVenueRow),
    amenities: null,
    additional_info: null,
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
    .from("venue_with_amenities")
    .select(OWNER_VENUE_SELECT_VIEW)
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

  const venuesFromView = (data as OwnerVenueRow[] | null) ?? []
  const venueIds = venuesFromView.map((venue) => venue.id)

  if (venueIds.length === 0) {
    return venuesFromView.map((venue) => ({
      ...venue,
      additional_info: null,
    }))
  }

  const additionalInfoResult = await client
    .from("venues")
    .select("id, additional_info")
    .in("id", venueIds)
    .in("organization_id", orgIds)

  const additionalInfoById = new Map<string, string | null>()

  if (!additionalInfoResult.error) {
    ;((additionalInfoResult.data ?? []) as Array<{ id: string; additional_info: string | null }>).forEach((row) => {
      additionalInfoById.set(row.id, row.additional_info ?? null)
    })
  }

  return venuesFromView.map((venue) => ({
    ...venue,
    additional_info: additionalInfoById.get(venue.id) ?? null,
  }))
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

  let { data, error } = await client
    .from("venues")
    .insert({
      ...baseInsert,
      additional_info: normalizeOptionalText(payload.additionalInfo),
    })
    .select("id, organization_id")
    .single()

  if (error && isAdditionalInfoMissingError(error)) {
    const fallbackInsert = await client
      .from("venues")
      .insert(baseInsert)
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

  const updates: Record<string, string | number | boolean | null> = {
    name: payload.name.trim(),
    location: normalizeOptionalText(payload.location),
    capacity: typeof payload.capacity === "number" ? payload.capacity : null,
    price: typeof payload.price === "number" ? payload.price : null,
    image: normalizeOptionalText(payload.image),
    description: normalizeOptionalText(payload.description),
    additional_info: normalizeOptionalText(payload.additionalInfo),
    venue_type: normalizeOptionalText(payload.venueType),
    is_available: payload.isAvailable ?? true,
  }

  let { data, error } = await client
    .from("venues")
    .update(updates)
    .eq("id", venueId)
    .in("organization_id", orgIds)
    .select("id, organization_id")
    .single()

  if (error && isAdditionalInfoMissingError(error)) {
    const { additional_info: _ignored, ...fallbackUpdates } = updates

    const fallbackUpdate = await client
      .from("venues")
      .update(fallbackUpdates)
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
