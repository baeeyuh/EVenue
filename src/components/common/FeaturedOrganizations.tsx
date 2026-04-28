import OrganizationCard from "@/components/common/OrganizationCard"
import { fetchFeaturedOrganizations } from "@/lib/services/organizations"

export default async function FeaturedOrganizations() {
  const organizations = await fetchFeaturedOrganizations()

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="mb-6 space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Featured organizations
        </p>
        <h2 className="text-3xl font-serif font-light tracking-tight">
          Trusted venue providers you can explore
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:gap-6">
        {organizations.map((organization) => (
          <OrganizationCard key={organization.id} {...organization} />
        ))}
      </div>
    </section>
  )
}