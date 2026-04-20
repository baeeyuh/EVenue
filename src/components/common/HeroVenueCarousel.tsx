"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { MapPin, Users } from "lucide-react"

import type { Venue } from "@/types/types"
import { cn } from "@/lib/utils"

type HeroVenueCarouselProps = {
  venues: Venue[]
}

export default function HeroVenueCarousel({
  venues,
}: HeroVenueCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const hasVenues = venues.length > 0

  useEffect(() => {
    if (!hasVenues || venues.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % venues.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [hasVenues, venues.length])

  const activeVenue = useMemo(() => {
    if (!hasVenues) return null
    return venues[activeIndex]
  }, [hasVenues, venues, activeIndex])

  if (!activeVenue) {
    return (
      <div className="relative">
        <div className="relative overflow-hidden rounded-[2rem] border bg-card shadow-xl">
          <div className="flex h-[420px] w-full items-center justify-center bg-muted/30">
            <div className="space-y-3 px-6 text-center">
              <p className="font-serif text-2xl font-light text-foreground">
                Featured venues coming soon
              </p>
              <p className="text-sm text-muted-foreground">
                Once venues are available, they will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[2rem] border bg-card shadow-xl">
        <div className="relative h-[420px] w-full">
          <Image
            src={activeVenue.image || "/images/placeholder-venue.jpg"}
            alt={activeVenue.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="rounded-[1.5rem] border border-white/20 bg-black/35 p-4 text-white backdrop-blur-md">
            <p className="text-lg font-semibold">{activeVenue.name}</p>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {activeVenue.location || "Location unavailable"}
              </span>

              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {activeVenue.capacity} pax
              </span>

              <span>{activeVenue.price}</span>
            </div>

          </div>
        </div>
      </div>

      {venues.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {venues.map((venue, index) => (
            <button
              key={venue.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to ${venue.name}`}
              className={cn(
                "h-2.5 rounded-full transition-all",
                index === activeIndex
                  ? "w-8 bg-primary"
                  : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}