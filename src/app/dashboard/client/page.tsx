import ClientHomeContent from "@/components/client/ClientHomeContent"
import { venueFiltersFromSearchParams } from "@/lib/venue-filters"

type ClientDashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ClientDashboardPage({
  searchParams,
}: ClientDashboardPageProps) {
  const resolvedSearchParams = await searchParams
  const filters = venueFiltersFromSearchParams(resolvedSearchParams)

  return <ClientHomeContent filters={filters} />
}
