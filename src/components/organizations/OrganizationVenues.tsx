import VenueCard from "@/components/common/VenueCard"
import type { Venue } from "@/lib/types"

export default function OrganizationVenues({ venues }: { venues: Venue[] }) {
  if (!venues.length) return null

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-light">Venues</h2>
      <div className="grid gap-4 sm:grid-cols-2">
                {venues.map((v) => (
                  <VenueCard
                    key={v.id}
                    {...v}
                    rating={v.rating ?? 0}
                    reviewCount={v.reviewCount ?? 0}
                    ownerName={v.ownerName ?? ""}
                    ownerInitials={v.ownerInitials ?? ""}
                  />
                ))}
      </div>
    </div>
  )
}