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
    {
      icon: Building2,
      label: "Venues Listed",
      shortLabel: "Venues",
      value: org.venue_count ?? org.venueCount ?? 0,
    },
    {
      icon: Star,
      label: "Avg Rating",
      shortLabel: "Rating",
      value: org.rating ? org.rating.toFixed(1) : "-",
    },
    {
      icon: Users,
      label: "Total Reviews",
      shortLabel: "Reviews",
      value: org.review_count ?? org.reviewCount ?? "-",
    },
    {
      icon: CalendarDays,
      label: "Est.",
      shortLabel: "Est.",
      value: org.established ?? "-",
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:gap-3">
      {stats.map(({ icon: Icon, label, shortLabel, value }) => (
        <div key={label} className="space-y-0.5 rounded-xl border border-border/40 bg-muted/50 p-2 sm:space-y-1.5 sm:p-3 lg:space-y-2 lg:p-3.5">
          <Icon className="h-3 w-3 text-muted-foreground sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
          <p className="font-serif text-xl font-light leading-tight sm:text-[1.45rem] lg:text-[1.6rem]">{value}</p>
          <p className="text-[8px] uppercase tracking-wide text-muted-foreground sm:text-[10px] sm:tracking-wide lg:text-[11px] lg:tracking-widest">
            <span className="md:hidden">{shortLabel}</span>
            <span className="hidden md:inline">{label}</span>
          </p>
        </div>
      ))}
    </div>
  )
}