import VenueCard from "@/components/common/VenueCard"
import { venues } from "@/lib/mock-data"

export default function FeaturedVenues() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-16">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Featured Venues</h2>
          <p className="text-muted-foreground">
            Explore some of the most recommended venues available.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((venue) => (
          <VenueCard
            key={venue.id}
            name={venue.name}
            location={venue.location}
            capacity={venue.capacity}
            price={venue.price}
            image={venue.image}
            amenities={venue.amenities}
          />
        ))}
      </div>
    </section>
  )
}