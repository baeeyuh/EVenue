import Image from "next/image"
import { MapPin } from "lucide-react"
import { StarRating } from "@/components/common/StarRating"

type OrganizationLike = {
  name: string
  logo?: string
  location?: string
  website?: string
  cover_image?: string
  coverImage?: string
  venue_count?: number
  rating?: number
  review_count?: number
  reviewCount?: number
}

export default function OrganizationHero({ org }: { org: OrganizationLike }) {
  const coverImage = org.cover_image ?? org.coverImage

  return (
    <div className="relative">

      {/* Cover image */}
  <div className="relative h-52 w-full overflow-hidden sm:h-64 md:h-80">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={org.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="w-full h-full bg-primary" />
        )}
        <div className="absolute inset-0 bg-primary/50" />
      </div>

      {/* Logo row — sits below cover, logo overlaps via negative margin */}
  <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Logo overlapping cover */}
        <div className="relative -mt-10 mb-3 flex items-end gap-3 sm:-mt-12 sm:mb-4 sm:gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-lg sm:h-24 sm:w-24">
            {org.logo ? (
              <Image
                src={org.logo}
                alt={org.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80px, 96px"
              />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
          </div>
        </div>

        {/* Name + location + stars */}
        <div className="space-y-1.5 border-b border-border/60 pb-5 sm:pb-6">
          <h1 className="font-serif text-2xl font-light leading-tight sm:text-3xl">
            {org.name}
          </h1>
          <div className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {org.location}
          </div>
          <StarRating rating={org.rating ?? 0} reviewCount={org.review_count ?? org.reviewCount ?? 0} size="sm" />
        </div>

      </div>
    </div>
  )
}