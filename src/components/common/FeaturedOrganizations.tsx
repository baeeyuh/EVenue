import OrganizationCard from "@/components/common/OrganizationCard"
import { fetchOrganizations } from "@/lib/services/organizations"

export default async function FeaturedOrganizations() {
  let organizations: any[] = []
  try {
    organizations = await fetchOrganizations()
    console.log("orgs data:", organizations) 
  } catch (err) {
    console.error("orgs error:", err) 
    organizations = []
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-16">
      <div className="mb-6 space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Featured organizations
        </p>
        <h2 className="text-3xl font-serif font-light tracking-tight">
          Trusted venue providers you can explore
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {organizations.map((organization: any) => (
          <OrganizationCard key={organization.id} {...organization} />
        ))}
      </div>
    </section>
  )
}