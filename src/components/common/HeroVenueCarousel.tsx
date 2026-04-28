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
        <div className="relative overflow-hidden rounded-[1.75rem] border bg-card shadow-xl sm:rounded-[2rem]">
          <div className="flex h-64 w-full items-center justify-center bg-muted/30 sm:h-95 lg:h-105">
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
      <div className="relative overflow-hidden rounded-[1.75rem] border bg-card shadow-xl sm:rounded-[2rem]">
        <div className="relative h-64 w-full sm:h-95 lg:h-105">
          <Image
            src={activeVenue.image || "/images/placeholder-venue.jpg"}
            alt={activeVenue.name}
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-5">
          <div className="rounded-[1rem] border border-white/15 bg-black/45 p-2.5 text-white shadow-lg backdrop-blur-md sm:rounded-[1.5rem] sm:p-4">
            <p className="line-clamp-2 text-sm font-semibold leading-tight sm:text-xl ">
              {activeVenue.name}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-relaxed text-white/85 sm:mt-2 sm:gap-x-3 sm:text-base">
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
                {activeVenue.location || "Location unavailable"}
              </span>

              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
                {activeVenue.capacity} pax
              </span>

              <span>{activeVenue.price}</span>
            </div>

          </div>
        </div>
      </div>

      {venues.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2 sm:mt-4">
          {venues.map((venue, index) => (
            <button
              key={venue.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to ${venue.name}`}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                index === activeIndex
                  ? "w-9 bg-primary shadow-[0_0_0_3px] shadow-primary/20"
                  : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}