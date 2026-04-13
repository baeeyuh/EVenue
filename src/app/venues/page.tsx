import FilterSection from "@/components/common/FilterSection"
import { venues, organizations } from "@/lib/mock-data"
import VenueCard from "@/components/common/VenueCard"

export default function VenuesPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Explore</p>
        <h1 className="font-serif text-4xl font-light mt-1 mb-8">Venues</h1>
      </div>

      <FilterSection />

      <div className="mx-auto max-w-7xl px-6 pb-16">
        <p className="text-xs text-muted-foreground mb-6">{venues.length} venues found</p>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue) => {
            const org = organizations.find((o) => o.id === venue.organizationId)
            return (
              <VenueCard
                key={venue.id}
                {...venue}
                ownerName={org?.name ?? venue.ownerName ?? ""}
                ownerInitials={
                  org?.name
                    ? org.name.split(" ").map((w) => w[0]).join("").slice(0, 2)
                    : venue.ownerInitials ?? ""
                }
              />
            )
          })}
        </div>
      </div>
    </main>
  )
}