import VenueCard from "@/components/common/VenueCard"
import { fetchVenues } from "@/lib/services/venues"

export default async function FeaturedVenues() {
  let venues: any[] = []
  try {
    venues = await fetchVenues()
  } catch (err) {
    venues = []
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-14">
      <div className="mb-6 space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Featured venues
        </p>
        <h2 className="font-serif font-light text-3xl tracking-tight">Curated spaces for every occasion</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((venue: any) => (
          <VenueCard key={venue.id} {...venue} />
        ))}
      </div>
    </section>
  )
}