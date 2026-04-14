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

export type OrganizationDetailsRow = {
  id: string
  name: string
  logo: string | null
  cover_image: string | null
  location: string | null
  description: string | null
  phone: string | null
  email: string | null
  website: string | null
  opening_hours: string | null
  established: string | null
  specializations: string[] | null
  gallery: string[] | null
}

export type OrganizationSocialRow = {
  platform: string
  url: string
}

type OrganizationRatingRow = {
  id: string | null
  name: string | null
  avg_rating: number | string | null
  total_reviews: number | string | null
}

export type OrganizationRatingSummary = {
  rating: number
  review_count: number
}

function mapOrganizationRating(row: OrganizationRatingRow): OrganizationRatingSummary {
  return {
    rating: Number(row.avg_rating ?? 0),
    review_count: Number(row.total_reviews ?? 0),
  }
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

export async function fetchOrganizationById(id: string): Promise<OrganizationDetailsRow | null> {
  const { data, error } = await supabaseServer
    .from("organizations")
    .select("id, name, logo, cover_image, location, description, phone, email, website, opening_hours, established, specializations, gallery")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error(error)
    return null
  }

  return (data as OrganizationDetailsRow | null) ?? null
}

export async function fetchOrganizationSocialsByOrganizationId(id: string): Promise<OrganizationSocialRow[]> {
  const { data, error } = await supabaseServer
    .from("organization_socials")
    .select("platform, url")
    .eq("organization_id", id)

  if (error) {
    console.error(error)
    return []
  }

  return (data as OrganizationSocialRow[] | null) ?? []
}

export async function fetchOrganizationRatingByOrganization(
  organizationId: string,
  organizationName?: string,
): Promise<OrganizationRatingSummary | null> {
  const { data: dataById, error: errorById } = await supabaseServer
    .from("organization_ratings")
    .select("id, name, avg_rating, total_reviews")
    .eq("id", organizationId)
    .maybeSingle()

  if (errorById) {
    console.error(errorById)
  } else if (dataById) {
    return mapOrganizationRating(dataById as OrganizationRatingRow)
  }

  if (!organizationName) return null

  const { data: dataByName, error: errorByName } = await supabaseServer
    .from("organization_ratings")
    .select("id, name, avg_rating, total_reviews")
    .eq("name", organizationName)
    .maybeSingle()

  if (errorByName) {
    console.error(errorByName)
    return null
  }

  return dataByName ? mapOrganizationRating(dataByName as OrganizationRatingRow) : null
}