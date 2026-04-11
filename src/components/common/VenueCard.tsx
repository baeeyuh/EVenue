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
  name: string
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
  venueType?: string
  isAvailable?: boolean
}

export default function VenueCard(props: VenueCardProps) {
  const [open, setOpen] = useState(false)
  const safeImage =
    props.image && props.image.startsWith("http")
      ? props.image
      : "/images/placeholder-venue.jpg"

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className="overflow-hidden rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer group p-0"
      >
        <div className="relative w-full aspect-3/2">
          <Image
            src={safeImage}
            alt={props.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-[10px] px-2.5 py-1 rounded-full tracking-wide font-medium">
            {props.isAvailable ? "Available" : "Unavailable"}
          </div>
        </div>

        <div className="p-4 pt-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-xl font-light leading-tight text-foreground">
              {props.name}
            </h3>
            <span className="text-base font-semibold text-primary whitespace-nowrap pt-0.5">
              {props.price}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground -mt-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {props.location}
          </div>

          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">{props.ownerName}</span>
          </div>

          <StarRating rating={props.rating} reviewCount={props.reviewCount} size="sm" />

          <div className="flex flex-wrap gap-1">
            {props.amenities?.slice(0, 4).map((a) => (
              <Badge key={a} variant="secondary" className="rounded-full text-[10px] px-2 py-0.5 font-normal">
                {a}
              </Badge>
            ))}
            {props.amenities?.length > 4 && (
              <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-0.5 font-normal">
                +{props.amenities.length - 4}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <span className="text-[11px] text-muted-foreground">{props.capacity} pax</span>
            <span className="text-[10px] text-muted-foreground">Click to view details</span>
          </div>
        </div>
      </Card>

      <VenueDetailsModal open={open} onClose={() => setOpen(false)} {...props} />
    </>
  )
}