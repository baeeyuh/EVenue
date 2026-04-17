import type { SupabaseClient } from "@supabase/supabase-js"

export type ClientProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  contact_number: string | null
  role: string | null
  created_at: string | null
}

export type ClientProfileUpdateInput = {
  firstName: string
  lastName: string
  contactNumber: string
}

const PROFILE_SELECT_WITH_PHONE_ALIAS =
  "id, first_name, last_name, email, contact_number:phone, role, created_at"
const PROFILE_SELECT_WITH_CONTACT_NUMBER =
  "id, first_name, last_name, email, contact_number, role, created_at"

function isMissingColumnError(error: unknown, columnName: string) {
  if (!error || typeof error !== "object") return false

  const candidate = error as { code?: string; message?: string }
  return (
    candidate.code === "42703" &&
    typeof candidate.message === "string" &&
    candidate.message.includes(columnName)
  )
}

export async function fetchClientProfile(client: SupabaseClient, userId: string): Promise<ClientProfileRow | null> {
  const { data, error } = await client
    .from("profiles")
    .select(PROFILE_SELECT_WITH_PHONE_ALIAS)
    .eq("id", userId)
    .maybeSingle()

  if (error && isMissingColumnError(error, "phone")) {
    const fallback = await client
      .from("profiles")
      .select(PROFILE_SELECT_WITH_CONTACT_NUMBER)
      .eq("id", userId)
      .maybeSingle()

    if (fallback.error) {
      console.error(fallback.error)
      throw new Error("Failed to fetch profile")
    }

    return (fallback.data as ClientProfileRow | null) ?? null
  }

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch profile")
  }

  return (data as ClientProfileRow | null) ?? null
}

export async function updateClientProfile(client: SupabaseClient, userId: string, payload: ClientProfileUpdateInput) {
  const baseUpdates = {
    first_name: payload.firstName.trim() || null,
    last_name: payload.lastName.trim() || null,
  }

  const { data, error } = await client
    .from("profiles")
    .update({
      ...baseUpdates,
      phone: payload.contactNumber.trim() || null,
    })
    .eq("id", userId)
    .select(PROFILE_SELECT_WITH_PHONE_ALIAS)
    .maybeSingle()

  if (error && isMissingColumnError(error, "phone")) {
    const fallback = await client
      .from("profiles")
      .update({
        ...baseUpdates,
        contact_number: payload.contactNumber.trim() || null,
      })
      .eq("id", userId)
      .select(PROFILE_SELECT_WITH_CONTACT_NUMBER)
      .maybeSingle()

    if (fallback.error) {
      console.error(fallback.error)
      throw new Error("Failed to update profile")
    }

    return (fallback.data as ClientProfileRow | null) ?? null
  }

  if (error) {
    console.error(error)
    throw new Error("Failed to update profile")
  }

  return (data as ClientProfileRow | null) ?? null
}
