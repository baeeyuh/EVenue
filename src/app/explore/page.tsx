import FeaturedOrganizations from "@/components/common/FeaturedOrganizations"
import FeaturedVenues from "@/components/common/FeaturedVenues"
import FilterSection from "@/components/common/FilterSection"
import ExploreTypeSwitch from "@/components/common/ExploreTypeSwitch"
import { venueFiltersFromSearchParams } from "@/lib/venue-filters"

type ExplorePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const resolvedSearchParams = await searchParams
  const filters = venueFiltersFromSearchParams(resolvedSearchParams)

  const type =
    typeof resolvedSearchParams.type === "string" &&
    resolvedSearchParams.type === "organizations"
      ? "organizations"
      : "venues"

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="sticky z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl" style={{ top: "var(--app-navbar-height, 0px)" }}>
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 sm:py-4">
          <ExploreTypeSwitch activeType={type} />
        </div>
      </section>

      {type === "venues" ? (
        <>
          <FilterSection initialFilters={filters} />
          <FeaturedVenues filters={filters} />
        </>
      ) : (
        <section className="mx-auto max-w-7xl px-6 pt-4">
          <FeaturedOrganizations />
        </section>
      )}
    </main>
  )
}