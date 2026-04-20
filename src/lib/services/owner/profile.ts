import type { SupabaseClient } from "@supabase/supabase-js"

export type OwnerProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  contact_number: string | null
  role: string | null
  created_at: string | null
}

function normalizeRole(role: string | null): string | null {
  if (!role) return null
  if (role === "buyer") return "client"
  return role
}

export async function fetchOwnerProfile(
  client: SupabaseClient,
  ownerId: string
): Promise<OwnerProfileRow | null> {
  const { data, error } = await client
    .from("profiles")
    .select("id, first_name, last_name, email, contact_number, role, created_at")
    .eq("id", ownerId)
    .maybeSingle()

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch owner profile")
  }

  const profile = (data as OwnerProfileRow | null) ?? null

  if (!profile) return null

  return {
    ...profile,
    role: normalizeRole(profile.role),
  }
}