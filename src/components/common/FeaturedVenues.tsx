import VenueCard from "@/components/common/VenueCard"
import { fetchVenues } from "@/lib/services/venues"
import type { VenueFilters } from "@/lib/venue-filters"

type FeaturedVenuesProps = {
  filters: VenueFilters
  limit?: number
}

export default async function FeaturedVenues({
  filters,
  limit,
}: FeaturedVenuesProps) {
  const venues = await fetchVenues(filters)
  const displayedVenues = typeof limit === "number" ? venues.slice(0, limit) : venues

  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
      <div className="mb-6 space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Featured venues
        </p>
        <h2 className="font-serif text-3xl font-light tracking-tight">
          Curated spaces for every occasion
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:gap-6">
        {displayedVenues.map((venue) => (
          <VenueCard key={venue.id} {...venue} />
        ))}
      </div>

      {displayedVenues.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          No venues match your selected filters.
        </p>
      )}
    </section>
  )
}