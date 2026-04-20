import { Building2, Star, Users, CalendarDays } from "lucide-react"
import type { Organization } from "@/lib/types"

export default function OrganizationStats({
  org,
}: {
  org: Organization & {
    rating?: number
    review_count?: number
    reviewCount?: number
    established?: string
    venueCount?: number
  }
}) {
  const stats = [
    { icon: Building2, label: "Venues Listed", value: org.venue_count ?? org.venueCount ?? 0 },
    { icon: Star, label: "Avg Rating", value: org.rating ? org.rating.toFixed(1) : "-" },
    { icon: Users, label: "Total Reviews", value: org.review_count ?? org.reviewCount ?? "-" },
    { icon: CalendarDays, label: "Est.", value: org.established ?? "-" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="bg-muted/50 rounded-2xl p-4 space-y-2 border border-border/40">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <p className="text-2xl font-serif font-light">{value}</p>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  )
}