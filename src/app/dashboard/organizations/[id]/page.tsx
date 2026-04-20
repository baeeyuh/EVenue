import { notFound } from "next/navigation"
import { fetchOrganizations } from "@/lib/services/organizations"
import { fetchVenues } from "@/lib/services/venues"
import OrganizationHero from "@/components/organizations/OrganizationHero"
import OrganizationStats from "@/components/organizations/OrganizationStats"
import OrganizationAbout from "@/components/organizations/OrganizationAbout"
import OrganizationGallery from "@/components/organizations/OrganizationGallery"
import OrganizationVenues from "@/components/organizations/OrganizationVenues"

export default async function OrganizationPage({ params }: { params: { id: string } }) {
  const [organizations, venues] = await Promise.all([fetchOrganizations(), fetchVenues()])

  const baseOrg = organizations.find((organization) => organization.id === params.id)
  if (!baseOrg) notFound()

  const orgVenues = venues.filter((venue) => venue.organizationId === baseOrg.id)

  const org = {
    ...baseOrg,
    cover_image: "",
    coverImage: "",
    venue_count: baseOrg.venueCount ?? orgVenues.length,
    rating: 0,
    review_count: 0,
    reviewCount: 0,
    phone: undefined,
    email: undefined,
    website: undefined,
    instagram: undefined,
    facebook: undefined,
    specializations: [],
    opening_hours: "",
    openingHours: "",
    established: undefined,
    gallery: [],
  }


  return (
    <main className="min-h-screen bg-background">
      <OrganizationHero org={org} />
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-12">
        <OrganizationStats org={org} />
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-12">
            <OrganizationGallery gallery={org.gallery} />
            <OrganizationVenues venues={orgVenues} />
          </div>
          <div>
            <OrganizationAbout org={org} />
          </div>
        </div>
      </div>
    </main>
  )
}