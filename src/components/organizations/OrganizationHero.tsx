import Image from "next/image"
import { MapPin, Globe, Clock } from "lucide-react"
import { StarRating } from "@/components/common/StarRating"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Organization } from "@/lib/types"

export default function OrganizationHero({ org }: { org: Organization & { rating?: number; reviewCount?: number } }) {
  return (
    <div className="relative">
      {/* Cover image */}
      <div className="relative h-72 w-full overflow-hidden md:h-96">
        <Image
          src={org.coverImage}
          alt={org.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-primary/60" />
      </div>

      {/* Content overlaid on cover */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative -mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-border/60">

          {/* Logo + name */}
          <div className="flex items-end gap-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-background shadow-lg shrink-0 bg-muted">
              <Image
                src={org.logo}
                alt={org.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="mb-1">
              <h1 className="font-serif text-3xl font-light leading-tight">
                {org.name}
              </h1>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {org.location}
              </div>
              <div className="mt-2">
                <StarRating rating={org.rating ?? 0} reviewCount={org.reviewCount ?? 0} size="sm" />
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-2 mb-1">
            <Button variant="outline" className="rounded-full text-sm gap-2">
              <Globe className="w-3.5 h-3.5" />
              Visit Website
            </Button>
            <Button className="rounded-full text-sm bg-primary">
              Send Inquiry
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}