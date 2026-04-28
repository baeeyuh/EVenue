"use client"
import Image from "next/image"
import { useState } from "react"
import { MapPin, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import VenueDetailsModal from "./VenueDetailsModal"
import { StarRating } from "./StarRating"

export type VenueCardProps = {
  id: string
  organizationId: string
  name: string
  organizationName?: string
  location: string
  capacity: number
  price: string
  image: string
  amenities: string[]
  rating: number
  reviewCount: number
  ownerName: string
  ownerInitials: string
  description?: string
  additionalInfo?: string
  venueType?: string
  isAvailable?: boolean
  context?: "client" | "owner"
  onOwnerEdit?: (venueId: string) => void
  onOwnerViewAvailability?: (venueId: string, venueName: string) => void
}

export default function VenueCard(props: VenueCardProps) {
  const [open, setOpen] = useState(false)
  const imageSrc = String(props.image ?? "").trim()
  const safeImage = imageSrc
    ? (imageSrc.startsWith("http") || imageSrc.startsWith("/")
        ? imageSrc
        : "/images/placeholder-venue.jpg")
    : "/images/placeholder-venue.jpg"
  const descriptionPreview = props.description?.trim()
  const additionalInfoPreview = props.additionalInfo?.trim()
  const infoPreview = additionalInfoPreview || descriptionPreview

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className="group cursor-pointer overflow-hidden rounded-2xl border-border/60 bg-card p-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="relative w-full" style={{ aspectRatio: "3/2", minHeight: 128 }}>
          <Image
            src={safeImage}
            alt={props.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-2.5 top-2.5 rounded-full bg-primary/90 px-2 py-0.5 text-[9px] font-medium tracking-wide text-primary-foreground sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
            {(props.isAvailable ?? true) ? "Available" : "Unavailable"}
          </div>
        </div>

  <div className="-mt-0.5 space-y-2 p-2.5 pt-0 sm:mt-0 sm:space-y-3 sm:p-4 sm:pt-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-serif text-sm font-light leading-tight text-foreground sm:text-xl">
              {props.name}
            </h3>
            <span className="whitespace-nowrap pt-0.5 text-xs font-semibold text-primary sm:text-base">
              {typeof props.price === "number"
                ? `₱${Number(props.price).toLocaleString()}`
                : props.price}
            </span>
          </div>

          <div className="-mt-1 flex items-center gap-1 text-[10px] text-muted-foreground sm:text-[11px]">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{props.location}</span>
          </div>

          {infoPreview && (
            <p className="hidden line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:block sm:text-xs">
              {infoPreview}
            </p>
          )}

          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate text-[10px] text-muted-foreground sm:text-[11px]">
              {props.ownerName}
            </span>
          </div>

          <StarRating rating={props.rating} reviewCount={props.reviewCount} size="sm" compact />

          <div className="hidden flex-wrap gap-1 sm:flex">
            {props.amenities?.slice(0, 4).map((a, index) => (
              <Badge
                key={a}
                variant="secondary"
                className={`rounded-full px-2 py-0.5 text-[9px] font-normal sm:text-[10px] ${index > 1 ? "hidden sm:inline-flex" : ""}`}
              >
                {a}
              </Badge>
            ))}
            {props.amenities?.length > 4 && (
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[9px] font-normal sm:text-[10px]">
                +{props.amenities.length - 4}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-2">
            <span className="text-[10px] text-muted-foreground sm:text-[11px]">{props.capacity} pax</span>
            <span className="text-[9px] text-muted-foreground sm:text-[10px]">View details</span>
          </div>
        </div>
      </Card>

      <VenueDetailsModal open={open} onClose={() => setOpen(false)} {...props} />
    </>
  )
}