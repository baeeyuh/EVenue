import VenueCard from "@/components/common/VenueCard"
import { venues } from "@/lib/mock-data"

export default function FeaturedVenues() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-14">
      <div className="mb-6 space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Featured venues
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">Curated spaces for every occasion</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((venue) => (
          <VenueCard key={venue.id} {...venue} />
        ))}
      </div>
    </section>
  )
}