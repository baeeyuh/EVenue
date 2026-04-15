import FeaturedOrganizations from "@/components/common/FeaturedOrganizations"
import FeaturedVenues from "@/components/common/FeaturedVenues"
import FilterSection from "@/components/common/FilterSection"
import HeroSection from "@/components/common/HeroSection"

type CustomerHomeContentProps = {
  filters: unknown
}

export default function CustomerHomeContent({
  filters,
}: CustomerHomeContentProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <FilterSection initialFilters={filters as never} />
      <FeaturedVenues filters={filters as never} />
      <FeaturedOrganizations />
    </main>
  )
}