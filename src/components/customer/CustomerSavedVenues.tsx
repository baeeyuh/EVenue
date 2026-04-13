import { Heart } from "lucide-react"
import { venues, organizations } from "@/lib/mock-data"
import VenueCard from "@/components/common/VenueCard"

const savedVenueIds = ["v1", "v3"]

export default function CustomerSavedVenues() {
  const savedVenues = venues.filter((v) => savedVenueIds.includes(v.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-light">Saved Venues</h2>
        <span className="text-xs text-muted-foreground">{savedVenues.length} saved</span>
      </div>

      {savedVenues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/60 rounded-2xl">
          <Heart className="w-8 h-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No saved venues yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Heart a venue to save it here</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {savedVenues.map((v) => {
            const org = organizations.find((o) => o.id === v.organizationId)
            return (
              <VenueCard
                key={v.id}
                {...v}
                ownerName={org?.name ?? v.ownerName ?? ""}
                ownerInitials={
                  org?.name
                    ? org.name.split(" ").map((w) => w[0]).join("").slice(0, 2)
                    : v.ownerInitials ?? ""
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}