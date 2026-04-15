import type { SupabaseClient } from "@supabase/supabase-js"

export type ClientSavedItemRow = {
  id: string
  item_id: string
  item_type: string
  created_at: string | null
  name: string
  location: string
}

export async function fetchClientSavedItems(client: SupabaseClient, userId: string): Promise<ClientSavedItemRow[]> {
  const { data: savedData, error: savedError } = await client
    .from("saved_items")
    .select("id, item_id, item_type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (savedError) {
    console.error(savedError)
    throw new Error("Failed to fetch saved items")
  }

  let savedItems = (savedData ?? []) as Array<{
    id: string
    item_id: string
    item_type: string
    created_at: string | null
  }>

  if (savedItems.length === 0 && process.env.NODE_ENV !== "production") {
    const { data: fallbackSavedData, error: fallbackSavedError } = await client
      .from("saved_items")
      .select("id, item_id, item_type, created_at")
      .order("created_at", { ascending: false })
      .limit(20)

    if (!fallbackSavedError && fallbackSavedData) {
      savedItems = fallbackSavedData as typeof savedItems
    }
  }

  const venueIds = savedItems
    .filter((item) => item.item_type === "venue")
    .map((item) => item.item_id)

  const organizationIds = savedItems
    .filter((item) => item.item_type === "organization")
    .map((item) => item.item_id)

  let venueMap = new Map<string, { name: string; location: string }>()
  let organizationMap = new Map<string, { name: string; location: string }>()

  if (venueIds.length > 0) {
    const { data: venuesData, error: venuesError } = await client
      .from("venues")
      .select("id, name, location")
      .in("id", venueIds)

    if (venuesError) {
      console.error(venuesError)
    } else {
      venueMap = new Map(
        ((venuesData ?? []) as Array<{ id: string; name: string | null; location: string | null }>).map((venue) => [
          venue.id,
          {
            name: venue.name ?? "Unknown venue",
            location: venue.location ?? "",
          },
        ])
      )
    }
  }

  if (organizationIds.length > 0) {
    const { data: organizationsData, error: organizationsError } = await client
      .from("organizations")
      .select("id, name, location")
      .in("id", organizationIds)

    if (organizationsError) {
      console.error(organizationsError)
    } else {
      organizationMap = new Map(
        ((organizationsData ?? []) as Array<{ id: string; name: string | null; location: string | null }>).map((organization) => [
          organization.id,
          {
            name: organization.name ?? "Unknown organization",
            location: organization.location ?? "",
          },
        ])
      )
    }
  }

  return savedItems.map((item) => {
    if (item.item_type === "venue") {
      const venue = venueMap.get(item.item_id)
      return {
        ...item,
        name: venue?.name ?? "Unknown venue",
        location: venue?.location ?? "",
      }
    }

    const organization = organizationMap.get(item.item_id)

    return {
      ...item,
      name: organization?.name ?? "Unknown organization",
      location: organization?.location ?? "",
    }
  })
}

export async function removeClientSavedItem(client: SupabaseClient, userId: string, savedItemId: string) {
  const { error } = await client
    .from("saved_items")
    .delete()
    .eq("id", savedItemId)
    .eq("user_id", userId)

  if (error) {
    console.error(error)
    throw new Error("Failed to remove saved item")
  }

  return { success: true }
}
