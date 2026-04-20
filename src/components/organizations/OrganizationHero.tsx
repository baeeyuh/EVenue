import Image from "next/image"
import { MapPin, Globe } from "lucide-react"
import { StarRating } from "@/components/common/StarRating"
import { Button } from "@/components/ui/button"

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
  const websiteHref = org.website
    ? org.website.startsWith("http")
      ? org.website
      : `https://${org.website}`
    : undefined

  return (
    <div className="relative">

      {/* Cover image */}
      <div className="relative h-64 w-full overflow-hidden md:h-80">
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
      <div className="mx-auto max-w-7xl px-6">

        {/* Logo overlapping cover */}
        <div className="relative -mt-12 mb-4 flex items-end justify-between gap-4">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-background shadow-lg shrink-0 bg-muted">
            {org.logo ? (
              <Image
                src={org.logo}
                alt={org.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
          </div>

          {/* CTAs aligned to bottom of logo */}
          <div className="flex gap-2 pb-1">
            {websiteHref && (
              <Button
                variant="outline"
                className="rounded-full text-sm gap-2"
                asChild
              >
                <a href={websiteHref} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-3.5 h-3.5" />
                  Visit Website
                </a>
              </Button>
            )}
            <Button className="rounded-full text-sm bg-primary">
              Send Inquiry
            </Button>
          </div>
        </div>

        {/* Name + location + stars */}
        <div className="pb-6 border-b border-border/60 space-y-1.5">
          <h1 className="font-serif text-3xl font-light leading-tight">
            {org.name}
          </h1>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {org.location}
          </div>
          <StarRating rating={org.rating ?? 0} reviewCount={org.review_count ?? org.reviewCount ?? 0} size="sm" />
        </div>

      </div>
    </div>
  )
}