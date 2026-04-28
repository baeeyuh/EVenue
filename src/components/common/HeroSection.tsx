import Link from "next/link"

import { Button } from "@/components/ui/button"
import { fetchFeaturedVenues } from "@/lib/services/venues"
import HeroVenueCarousel from "@/components/common/HeroVenueCarousel"

export default async function HeroSection() {
  const venues = await fetchFeaturedVenues()
  const featuredVenues = venues.slice(0, 5)

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-secondary/40 via-background to-background" />
      <div className="absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -left-16 top-1/3 -z-10 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-6 pt-6 sm:px-6 sm:pt-8 md:pb-10 md:pt-10 lg:grid-cols-2 lg:items-center lg:gap-10">
        <div className="space-y-5 text-center lg:text-left">
          <p className="px-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground sm:text-sm">
            Discover & Book Now
          </p>

          <div className="space-y-3 sm:space-y-4">
            <h1 className="mx-auto max-w-2xl text-balance text-3xl font-serif font-light leading-tight tracking-tight sm:text-4xl md:text-5xl xl:text-6xl lg:mx-0">
              Every great event starts with the right space.
            </h1>

            <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 md:text-lg lg:mx-0">
              Browse curated spaces, compare details clearly, and connect with venue
              organizations in one sleek and organized platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-3 lg:justify-start">
            <Button asChild size="lg" className="h-10 w-full min-w-0 rounded-full px-3 text-xs sm:w-auto sm:px-8 sm:text-sm">
              <Link href="/explore?type=venues">
                <span className="sm:hidden">Explore Venues</span>
                <span className="hidden sm:inline">Explore Venues</span>
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-10 w-full min-w-0 rounded-full px-3 text-xs sm:w-auto sm:px-8 sm:text-sm"
            >
              <Link href="/explore?type=organizations">
                <span className="sm:hidden">Browse Organizations</span>
                <span className="hidden sm:inline">Browse Organizations</span>
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1 sm:flex sm:flex-wrap sm:justify-center sm:gap-3 lg:justify-start">
            <div className="rounded-2xl border bg-card/80 px-2.5 py-2.5 text-left shadow-sm backdrop-blur sm:px-4 sm:py-3">
              <p className="font-serif text-lg font-medium tracking-tight sm:text-2xl">100+</p>
              <p className="text-[11px] font-medium text-muted-foreground sm:text-sm sm:font-normal">Curated venues</p>
            </div>

            <div className="rounded-2xl border bg-card/80 px-2.5 py-2.5 text-left shadow-sm backdrop-blur sm:px-4 sm:py-3">
              <p className="font-serif text-lg font-medium tracking-tight sm:text-2xl">24/7</p>
              <p className="text-[11px] font-medium text-muted-foreground sm:text-sm sm:font-normal">Easy browsing</p>
            </div>

            <div className="rounded-2xl border bg-card/80 px-2.5 py-2.5 text-left shadow-sm backdrop-blur sm:px-4 sm:py-3">
              <p className="font-serif text-lg font-medium tracking-tight sm:text-2xl">Fast</p>
              <p className="text-[11px] font-medium text-muted-foreground sm:text-sm sm:font-normal">Compare options</p>
            </div>
          </div>
        </div>

        <HeroVenueCarousel venues={featuredVenues} />
      </div>
    </section>
  )
}