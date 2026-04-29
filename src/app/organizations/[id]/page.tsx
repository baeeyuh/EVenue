import { notFound } from "next/navigation"
import OrganizationHero from "@/components/organizations/OrganizationHero"
import OrganizationStats from "@/components/organizations/OrganizationStats"
import OrganizationAbout from "@/components/organizations/OrganizationAbout"
import OrganizationGallery from "@/components/organizations/OrganizationGallery"
import OrganizationVenues from "@/components/organizations/OrganizationVenues"
import type { Metadata } from "next"
import {
  fetchOrganizationById,
  fetchOrganizationRatingByOrganization,
  fetchOrganizationSocialsByOrganizationId,
} from "@/lib/services/organizations"
import { fetchVenueGalleryByVenueIds, fetchVenuesByOrganizationId } from "@/lib/services/venues"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const org = await fetchOrganizationById(id)
  if (!org) return {}

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  return {
    title: org.name,
    alternates: {
      canonical: `${site}/organizations/${org.id}`,
    },
  }
}

export default async function OrganizationPublicPage({ params }: Props) {
  const { id } = await params

  const org = await fetchOrganizationById(id)

  if (!org) notFound()

  const [orgSocials, orgVenues, orgRatings] = await Promise.all([
    fetchOrganizationSocialsByOrganizationId(id),
    fetchVenuesByOrganizationId(id),
    fetchOrganizationRatingByOrganization(id, org.name),
  ])

  const venueGallery = await fetchVenueGalleryByVenueIds(orgVenues.map((venue) => venue.id))

  const normalizedOrg = {
    ...org,
    logo: org.logo ?? "",
    cover_image: org.cover_image ?? "",
    location: org.location ?? "",
    description: org.description ?? "",
    phone: org.phone ?? undefined,
    email: org.email ?? undefined,
    website: org.website ?? undefined,
    opening_hours: org.opening_hours ?? undefined,
    established: org.established ?? undefined,
    specializations: org.specializations ?? [],
    gallery: venueGallery,
    venue_count: orgRatings?.venue_count ?? orgVenues.length,
    rating: orgRatings?.rating,
    review_count: orgRatings?.review_count,
    organization_socials: orgSocials,
  }

  return (
    <main className="min-h-screen bg-background">
      <OrganizationHero org={normalizedOrg} />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10">
        <OrganizationStats org={normalizedOrg} />
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="space-y-8 lg:col-span-2 lg:space-y-12">
            <OrganizationVenues
              venues={orgVenues.map((v) => ({
                ...v,
                organization_id: v.organization_id ?? "",
                location: v.location ?? "",
                capacity: v.capacity ?? 0,
                price: v.price ?? 0,
                image: v.image ?? "",
                amenities: v.amenities ?? [],
                rating: Number(v.rating ?? 0),
                review_count: v.review_count ?? 0,
                owner_name: normalizedOrg.name,
                owner_initials: normalizedOrg.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase(),
                description: v.description ?? undefined,
                additional_info: v.additional_info ?? undefined,
                venue_type: v.venue_type ?? undefined,
                is_available: v.is_available ?? true,
              }))}
            />
            <OrganizationGallery gallery={normalizedOrg.gallery} />
          </div>
          <div>
            <OrganizationAbout org={normalizedOrg} />
          </div>
        </div>
      </div>
    </main>
  )
}