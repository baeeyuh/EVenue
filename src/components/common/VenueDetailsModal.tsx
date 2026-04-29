"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { MapPin, Building2, Trash2 } from "lucide-react"
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
  onOwnerDelete,
}: Props) {
  const isOwnerContext = context === "owner"
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [selectedInquiryDate, setSelectedInquiryDate] = useState("")
  const imageSrc = String(image ?? "").trim()
  const safeImage = imageSrc
    ? imageSrc.startsWith("http") || imageSrc.startsWith("/")
      ? imageSrc
      : "/images/placeholder-venue.jpg"
    : "/images/placeholder-venue.jpg"

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="flex max-h-[90svh] w-[calc(100vw-1rem)] max-w-lg flex-col overflow-hidden gap-0 rounded-2xl border-border/60 p-0">
          <div className="relative h-52 w-full shrink-0">
            <Image src={safeImage} alt={name} fill className="object-cover" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            <div className="space-y-4">
              <DialogHeader className="space-y-0">
                <div className="mb-2 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{ownerName}</span>
                </div>

                 <DialogTitle className="font-serif text-2xl font-light leading-tight">
                  {name}
                </DialogTitle>

                <DialogDescription className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
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
                    <div key={label} className="rounded-xl bg-muted/60 p-3">
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
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
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Amenities
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {amenities.map((a) => (
                      <Badge
                        key={a}
                        variant="secondary"
                        className="rounded-full text-xs font-normal"
                      >
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {additionalInfo && (
                <div className="space-y-2">
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Additional Info
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {additionalInfo}
                  </p>
                </div>
              )}

              {description && (
                <p className="border-t border-border/60 pt-4 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              )}

               <div className="grid grid-cols-2 gap-3 sticky bottom-0 mt-4 pt-4 bg-background/80 backdrop-blur-sm">
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

                    <Button
                      variant="destructive"
                      className="col-span-2 w-full rounded-full"
                      onClick={() => {
                        onClose()
                        onOwnerDelete?.(id, name)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Venue
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
