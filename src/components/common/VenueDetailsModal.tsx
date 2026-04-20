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
  venueType,
  isAvailable,
}: Props) {
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [selectedInquiryDate, setSelectedInquiryDate] = useState("")

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-lg border-border/60 gap-0">
          <div className="relative h-52 w-full">
            <Image src={image} alt={name} fill className="object-cover" />
          </div>

          <div className="p-6 space-y-4">
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

            {!!amenities?.length && (
              <div className="flex flex-wrap gap-1.5">
                {amenities.map((a) => (
                  <Badge key={a} variant="secondary" className="rounded-full text-xs font-normal">
                    {a}
                  </Badge>
                ))}
              </div>
            )}

            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-4">
                {description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
  )
}