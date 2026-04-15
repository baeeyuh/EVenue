import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 from-secondary/30 via-background to-background" />
      <div className="absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="mx-auto grid max-w-7xl gap-10 px-6 pt-8 pb-6 md:pt-10 md:pb-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground px-1">
          Discover & Book Now
          </p>

          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-serif font-lightl leading-tight tracking-tight md:text-5xl xl:text-6xl">
              Every great event starts with the right space.
            </h1>

            <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              Browse curated spaces, compare details clearly, and connect with venue
              organizations in one sleek and organized platform.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/explore?type=venues">Explore Venues</Link>
            </Button>

            <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <Link href="/explore?type=organizations">Browse Organizations</Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <div className="rounded-2xl border bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-2xl font-semibold tracking-tight">100+</p>
              <p className="text-sm text-muted-foreground">Curated venues</p>
            </div>

            <div className="rounded-2xl border bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-2xl font-semibold tracking-tight">24/7</p>
              <p className="text-sm text-muted-foreground">Easy browsing</p>
            </div>

            <div className="rounded-2xl border bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-2xl font-semibold tracking-tight">Fast</p>
              <p className="text-sm text-muted-foreground">Compare options</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[2rem] border bg-card shadow-xl">
            <div className="relative h-[420px] w-full">
              <Image
                src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80"
                alt="Elegant event venue"
                fill
                preload
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="rounded-[1.5rem] border border-white/20 bg-black/35 p-4 text-white backdrop-blur-md">
                <p className="text-lg font-semibold">Glasshaus Events Place</p>
                <p className="text-sm text-white/80">
                  Cagayan de Oro City • 180 pax • ₱45,000
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}