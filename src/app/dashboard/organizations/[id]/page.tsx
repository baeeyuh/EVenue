import { notFound } from "next/navigation"
import { organizations, venues } from "@/lib/mock-data"
import OrganizationHero from "@/components/organizations/OrganizationHero"
import OrganizationStats from "@/components/organizations/OrganizationStats"
import OrganizationAbout from "@/components/organizations/OrganizationAbout"
import OrganizationGallery from "@/components/organizations/OrganizationGallery"
import OrganizationVenues from "@/components/organizations/OrganizationVenues"

export default function OrganizationPage({ params }: { params: { id: string } }) {
  const org = organizations.find((o) => o.id === params.id)
  if (!org) notFound()

  const orgVenues = venues.filter((v) => v.organizationId === org.id)

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