import FeaturedOrganizations from "@/components/common/FeaturedOrganizations"
import FeaturedVenues from "@/components/common/FeaturedVenues"
import FilterSection from "@/components/common/FilterSection"
import HeroSection from "@/components/common/HeroSection"
import { venueFiltersFromSearchParams } from "@/lib/venue-filters"

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams
  const filters = venueFiltersFromSearchParams(resolvedSearchParams)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <FilterSection initialFilters={filters} />
      <FeaturedVenues filters={filters} />
      <FeaturedOrganizations />
    </main>
  )
}