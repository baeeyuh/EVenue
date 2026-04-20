import FeaturedOrganizations from "@/components/common/FeaturedOrganizations"
import FeaturedVenues from "@/components/common/FeaturedVenues"
import FilterSection from "@/components/common/FilterSection"
import HeroSection from "@/components/common/HeroSection"

type ClientHomeContentProps = {
  filters: unknown
}

export default function ClientHomeContent({
  filters,
}: ClientHomeContentProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <FilterSection initialFilters={filters as never} />
      <FeaturedVenues filters={filters as never} limit={6} />
      <FeaturedOrganizations />
    </main>
  )
}