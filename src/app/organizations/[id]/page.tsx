import { notFound } from "next/navigation"
import { organizations, venues } from "@/lib/mock-data"
import OrganizationHero from "@/components/organizations/OrganizationHero"
import OrganizationStats from "@/components/organizations/OrganizationStats"
import OrganizationAbout from "@/components/organizations/OrganizationAbout"
import OrganizationGallery from "@/components/organizations/OrganizationGallery"
import OrganizationVenues from "@/components/organizations/OrganizationVenues"
import type { Metadata } from "next"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const org = organizations.find((o) => o.id === id)
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

  const org = organizations.find((o) => o.id === id)
  if (!org) notFound()

  const orgVenues = venues.filter((v) => v.organizationId === org.id)

  return (
    <main className="min-h-screen bg-background">
      <OrganizationHero org={{ ...org, cover_image: org.coverImage, venue_count: org.venueCount }} />
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-12">
        <OrganizationStats org={{ ...org, cover_image: org.coverImage, venue_count: org.venueCount }} />
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-12">
            <OrganizationGallery gallery={org.gallery} />
            <OrganizationVenues
              venues={orgVenues.map((v) => ({
                ...v,
                organization_id: v.organizationId,
                price: typeof v.price === "string" ? parseFloat(v.price) : v.price,
              }))}
            />
          </div>
          <div>
            <OrganizationAbout org={{ ...org, cover_image: org.coverImage, venue_count: org.venueCount }} />
          </div>
        </div>
      </div>
    </main>
  )
}