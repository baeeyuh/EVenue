import VenueCard from "@/components/common/VenueCard"
import { fetchVenues } from "@/lib/services/venues"
import type { VenueFilters } from "@/lib/venue-filters"

type FeaturedVenuesProps = {
  filters: VenueFilters
}

export default async function FeaturedVenues({ filters }: FeaturedVenuesProps) {
  const venues = await fetchVenues(filters)

  return (
    <section className="mx-auto max-w-7xl px-6 pb-14">
      <div className="mb-6 space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Featured venues
        </p>
        <h2 className="font-serif font-light text-3xl tracking-tight">Curated spaces for every occasion</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((venue) => (
          <VenueCard key={venue.id} {...venue} />
        ))}
      </div>

      {venues.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No venues match your selected filters.</p>
      )}
    </section>
  )
}