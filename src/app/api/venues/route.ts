import { NextResponse } from "next/server"
import { fetchVenues } from "@/lib/services/venues"
import { venueFiltersFromSearchParams } from "@/lib/venue-filters"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const filters = venueFiltersFromSearchParams(url.searchParams)
    const venues = await fetchVenues(filters)
    return NextResponse.json(venues)
  } catch {
    return NextResponse.json({ message: "Failed to fetch venues" }, { status: 500 })
  }
}
