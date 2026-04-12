import { supabaseServer } from "@/lib/supabaseServer"
import { headers } from "next/headers"
import type { Organization } from "@/types/types"

type OrganizationRow = {
  id: string
  name: string
  logo: string | null
  location: string | null
  description: string | null
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabaseServer
    .from("organizations")
    .select("id, name, logo, location, description")
    .limit(10)

  if (error) {
    console.error(error)
    throw new Error("Failed to fetch organizations")
  }

  return ((data ?? []) as OrganizationRow[]).map((organization) => ({
    id: organization.id,
    name: organization.name,
    logo: organization.logo ?? "",
    location: organization.location ?? "",
    description: organization.description ?? "",
    venueCount: 0,
  }))
}

export async function fetchFeaturedOrganizations(): Promise<Organization[]> {
  try {
    const requestHeaders = await headers()
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")

    if (!host) return []

    const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https")
    const response = await fetch(`${protocol}://${host}/api/organizations`, { cache: "no-store" })

    if (!response.ok) return []

    return (await response.json()) as Organization[]
  } catch {
    return []
  }
}