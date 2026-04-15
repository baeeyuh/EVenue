import CustomerHomeContent from "@/components/customer/CustomerHomeContent"
import { venueFiltersFromSearchParams } from "@/lib/venue-filters"

type CustomerDashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CustomerDashboardPage({
  searchParams,
}: CustomerDashboardPageProps) {
  const resolvedSearchParams = await searchParams
  const filters = venueFiltersFromSearchParams(resolvedSearchParams)

  return <CustomerHomeContent filters={filters} />
}