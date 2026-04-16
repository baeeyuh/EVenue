import type { SupabaseClient } from "@supabase/supabase-js"

export type ClientProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: string | null
  created_at: string | null
}

export type ClientProfileUpdateInput = {
  firstName: string
  lastName: string
  contactNumber: string
}

export async function fetchClientProfile(client: SupabaseClient, userId: string): Promise<ClientProfileRow | null> {
  const { data, error } = await client
    .from("profiles")
    .select("id, first_name, last_name, email, role, created_at")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch profile")
  }

  return (data as ClientProfileRow | null) ?? null
}

export async function updateClientProfile(client: SupabaseClient, userId: string, payload: ClientProfileUpdateInput) {
  const updates = {
    first_name: payload.firstName.trim() || null,
    last_name: payload.lastName.trim() || null,
  }

  const { data, error } = await client
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, first_name, last_name, email, role, created_at")
    .maybeSingle()

  if (error) {
    console.error(error)
    throw new Error("Failed to update profile")
  }

  return (data as ClientProfileRow | null) ?? null
}
