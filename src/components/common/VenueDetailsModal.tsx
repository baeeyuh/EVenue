"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { MapPin, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { StarRating } from "./StarRating"
import CheckAvailabilityModal from "./CheckAvailabiltyModal"
import SendInquiryModal from "./SendInquiryModal"
import type { VenueCardProps } from "./VenueCard"

type Props = VenueCardProps & {
  open: boolean
  onClose: () => void
}

export default function VenueDetailsModal({
  open,
  onClose,
  id,
  name,
  location,
  capacity,
  price,
  image,
  amenities,
  rating,
  reviewCount,
  ownerName,
  description,
  additionalInfo,
  venueType,
  isAvailable,
  context,
  onOwnerEdit,
  onOwnerViewAvailability,
}: Props) {
  const isOwnerContext = context === "owner"
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [selectedInquiryDate, setSelectedInquiryDate] = useState("")
  const imageSrc = String(image ?? "").trim()
  const safeImage = imageSrc
    ? (imageSrc.startsWith("http") || imageSrc.startsWith("/")
        ? imageSrc
        : "/images/placeholder-venue.jpg")
    : "/images/placeholder-venue.jpg"

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[calc(100%-1rem)] max-h-[92dvh] max-w-lg overflow-hidden rounded-2xl border-border/60 p-0 gap-0 sm:max-h-[88vh]">
          <div className="relative h-44 w-full sm:h-52">
            <Image src={safeImage} alt={name} fill className="object-cover" />
          </div>

          <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="space-y-0">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{ownerName}</span>
              </div>

              <DialogTitle className="font-serif text-2xl font-light leading-tight">
                {name}
              </DialogTitle>

              <DialogDescription className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                <MapPin className="w-3 h-3" />
                {location}
              </DialogDescription>
            </DialogHeader>

            <StarRating rating={rating} reviewCount={reviewCount} />

            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Venue information
              </p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Capacity", value: `${capacity} pax` },
                  { label: "Starting price", value: price },
                  {
                    label: "Availability",
                    value: isAvailable ? "Open" : "Unavailable",
                    valueClass: isAvailable ? "text-green-600" : "text-destructive",
                  },
                  { label: "Type", value: venueType ?? "Event Hall" },
                ].map(({ label, value, valueClass }) => (
                  <div key={label} className="bg-muted/60 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {label}
                    </p>
                    <p className={cn("text-sm font-medium", valueClass ?? "text-foreground")}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {!!amenities?.length && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {amenities.map((a) => (
                    <Badge key={a} variant="secondary" className="rounded-full text-xs font-normal">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-4">
                {description}
              </p>
            )}

            {additionalInfo && (
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Additional info section
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {additionalInfo}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {isOwnerContext ? (
                <>
                  <Button
                    className="w-full rounded-full bg-primary hover:bg-primary/90"
                    onClick={() => {
                      onClose()
                      onOwnerEdit?.(id)
                    }}
                  >
                    Edit Venue
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full rounded-full border-border/60 bg-background hover:bg-muted"
                    onClick={() => {
                      onClose()
                      onOwnerViewAvailability?.(id, name)
                    }}
                  >
                    View Availability
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-full rounded-full bg-primary hover:bg-primary/90"
                    onClick={() => setAvailabilityOpen(true)}
                  >
                    Check Availability
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full rounded-full border-border/60 bg-background hover:bg-muted"
                    onClick={() => setInquiryOpen(true)}
                  >
                    Send Inquiry
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {!isOwnerContext && (
        <>
          <CheckAvailabilityModal
            open={availabilityOpen}
            onOpenChange={setAvailabilityOpen}
            venueId={id}
            venueName={name}
            venueLocation={location}
            onContinue={(date) => {
              setSelectedInquiryDate(date)
              setAvailabilityOpen(false)
              setInquiryOpen(true)
            }}
          />

          <SendInquiryModal
            open={inquiryOpen}
            onOpenChange={setInquiryOpen}
            venueId={id}
            venueName={name}
            venueLocation={location}
            ownerName={ownerName}
            venueCapacity={capacity}
            initialEventDate={selectedInquiryDate}
          />
        </>
      )}
    </>
  )
}