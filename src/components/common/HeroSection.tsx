import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 text-center md:py-28">
      <h1 className="mx-auto max-w-5xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
        Discover & Book Event Venues
      </h1>

      <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
        Find venues with transparent details, compare options easily, and make
        event planning faster and more organized.
      </p>

      <div className="mt-8">
        <Button size="lg" className="rounded-full px-8">
          Explore Venues
        </Button>
      </div>
    </section>
  )
}