import type { SupabaseClient } from "@supabase/supabase-js"

export async function getOwnerOrgIds(client: SupabaseClient, ownerId: string): Promise<string[]> {
  const { data, error } = await client
    .from("organizations")
    .select("id")
    .eq("owner_id", ownerId)

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch owner organizations")
  }

  return ((data as Array<{ id: string }> | null) ?? []).map((org) => org.id)
}