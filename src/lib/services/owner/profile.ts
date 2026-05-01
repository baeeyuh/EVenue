import type { SupabaseClient } from "@supabase/supabase-js"

export type OwnerProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  business_name: string | null
  business_address: string | null
  city: string | null
  province: string | null
  email: string | null
  contact_number: string | null
  role: string | null
  created_at: string | null
}

export type OwnerProfileUpdateInput = {
  firstName: string
  lastName: string
  contactNumber: string
  businessName: string
  businessAddress: string
  city: string
  province: string
}

const PROFILE_SELECT_WITH_PHONE_ALIAS =
  "id, first_name, last_name, business_name, business_address, city, province, email, contact_number:phone, role, created_at"
const PROFILE_SELECT_WITH_CONTACT_NUMBER =
  "id, first_name, last_name, business_name, business_address, city, province, email, contact_number, role, created_at"
const PROFILE_SELECT_BASE_WITH_PHONE_ALIAS =
  "id, first_name, last_name, email, contact_number:phone, role, created_at"
const PROFILE_SELECT_BASE_WITH_CONTACT_NUMBER =
  "id, first_name, last_name, email, contact_number, role, created_at"

const BUSINESS_PROFILE_COLUMNS = ["business_name", "business_address", "city", "province"] as const

function isMissingColumnError(error: unknown, columnName: string) {
  if (!error || typeof error !== "object") return false

  const candidate = error as { code?: string; message?: string }
  return (
    candidate.code === "42703" &&
    typeof candidate.message === "string" &&
    candidate.message.includes(columnName)
  )
}

function isMissingBusinessColumnError(error: unknown) {
  return BUSINESS_PROFILE_COLUMNS.some((column) => isMissingColumnError(error, column))
}

function normalizeRole(role: string | null): string | null {
  if (!role) return null
  if (role === "buyer") return "client"
  return role
}

function normalizeProfile(profile: OwnerProfileRow | null): OwnerProfileRow | null {
  if (!profile) return null

  return {
    ...profile,
    role: normalizeRole(profile.role),
  }
}

function withEmptyBusinessFields(profile: Omit<
  OwnerProfileRow,
  "business_name" | "business_address" | "city" | "province"
> | null): OwnerProfileRow | null {
  if (!profile) return null

  return {
    ...profile,
    business_name: null,
    business_address: null,
    city: null,
    province: null,
  }
}

export async function fetchOwnerProfile(
  client: SupabaseClient,
  ownerId: string
): Promise<OwnerProfileRow | null> {
  const { data, error } = await client
    .from("profiles")
    .select(PROFILE_SELECT_WITH_PHONE_ALIAS)
    .eq("id", ownerId)
    .maybeSingle()

  if (error && isMissingColumnError(error, "phone")) {
    const fallback = await client
      .from("profiles")
      .select(PROFILE_SELECT_WITH_CONTACT_NUMBER)
      .eq("id", ownerId)
      .maybeSingle()

    if (fallback.error && isMissingBusinessColumnError(fallback.error)) {
      const baseFallback = await client
        .from("profiles")
        .select(PROFILE_SELECT_BASE_WITH_CONTACT_NUMBER)
        .eq("id", ownerId)
        .maybeSingle()

      if (baseFallback.error) {
        console.error(baseFallback.error)
        throw new Error("Failed to fetch owner profile")
      }

      return normalizeProfile(withEmptyBusinessFields(baseFallback.data ?? null))
    }

    if (fallback.error) {
      console.error(fallback.error)
      throw new Error("Failed to fetch owner profile")
    }

    return normalizeProfile((fallback.data as OwnerProfileRow | null) ?? null)
  }

  if (error && isMissingBusinessColumnError(error)) {
    const fallback = await client
      .from("profiles")
      .select(PROFILE_SELECT_BASE_WITH_PHONE_ALIAS)
      .eq("id", ownerId)
      .maybeSingle()

    if (fallback.error && isMissingColumnError(fallback.error, "phone")) {
      const contactFallback = await client
        .from("profiles")
        .select(PROFILE_SELECT_BASE_WITH_CONTACT_NUMBER)
        .eq("id", ownerId)
        .maybeSingle()

      if (contactFallback.error) {
        console.error(contactFallback.error)
        throw new Error("Failed to fetch owner profile")
      }

      return normalizeProfile(withEmptyBusinessFields(contactFallback.data ?? null))
    }

    if (fallback.error) {
      console.error(fallback.error)
      throw new Error("Failed to fetch owner profile")
    }

    return normalizeProfile(withEmptyBusinessFields(fallback.data ?? null))
  }

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch owner profile")
  }

  return normalizeProfile((data as OwnerProfileRow | null) ?? null)
}

export async function updateOwnerProfile(
  client: SupabaseClient,
  ownerId: string,
  payload: OwnerProfileUpdateInput
): Promise<OwnerProfileRow | null> {
  const baseUpdates = {
    first_name: payload.firstName.trim() || null,
    last_name: payload.lastName.trim() || null,
    business_name: payload.businessName.trim() || null,
    business_address: payload.businessAddress.trim() || null,
    city: payload.city.trim() || null,
    province: payload.province.trim() || null,
  }

  const { data, error } = await client
    .from("profiles")
    .update({
      ...baseUpdates,
      phone: payload.contactNumber.trim() || null,
    })
    .eq("id", ownerId)
    .select(PROFILE_SELECT_WITH_PHONE_ALIAS)
    .maybeSingle()

  if (error && isMissingColumnError(error, "phone")) {
    const fallback = await client
      .from("profiles")
      .update({
        ...baseUpdates,
        contact_number: payload.contactNumber.trim() || null,
      })
      .eq("id", ownerId)
      .select(PROFILE_SELECT_WITH_CONTACT_NUMBER)
      .maybeSingle()

    if (fallback.error && isMissingBusinessColumnError(fallback.error)) {
      const baseFallback = await client
        .from("profiles")
        .update({
          first_name: baseUpdates.first_name,
          last_name: baseUpdates.last_name,
          contact_number: payload.contactNumber.trim() || null,
        })
        .eq("id", ownerId)
        .select(PROFILE_SELECT_BASE_WITH_CONTACT_NUMBER)
        .maybeSingle()

      if (baseFallback.error) {
        console.error(baseFallback.error)
        throw new Error("Failed to update owner profile")
      }

      return normalizeProfile(withEmptyBusinessFields(baseFallback.data ?? null))
    }

    if (fallback.error) {
      console.error(fallback.error)
      throw new Error("Failed to update owner profile")
    }

    return normalizeProfile((fallback.data as OwnerProfileRow | null) ?? null)
  }

  if (error && isMissingBusinessColumnError(error)) {
    const fallback = await client
      .from("profiles")
      .update({
        first_name: baseUpdates.first_name,
        last_name: baseUpdates.last_name,
        phone: payload.contactNumber.trim() || null,
      })
      .eq("id", ownerId)
      .select(PROFILE_SELECT_BASE_WITH_PHONE_ALIAS)
      .maybeSingle()

    if (fallback.error && isMissingColumnError(fallback.error, "phone")) {
      const contactFallback = await client
        .from("profiles")
        .update({
          first_name: baseUpdates.first_name,
          last_name: baseUpdates.last_name,
          contact_number: payload.contactNumber.trim() || null,
        })
        .eq("id", ownerId)
        .select(PROFILE_SELECT_BASE_WITH_CONTACT_NUMBER)
        .maybeSingle()

      if (contactFallback.error) {
        console.error(contactFallback.error)
        throw new Error("Failed to update owner profile")
      }

      return normalizeProfile(withEmptyBusinessFields(contactFallback.data ?? null))
    }

    if (fallback.error) {
      console.error(fallback.error)
      throw new Error("Failed to update owner profile")
    }

    return normalizeProfile(withEmptyBusinessFields(fallback.data ?? null))
  }

  if (error) {
    console.error(error)
    throw new Error("Failed to update owner profile")
  }

  return normalizeProfile((data as OwnerProfileRow | null) ?? null)
}
