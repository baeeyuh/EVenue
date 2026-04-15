export const MAX_BUDGET = 200000
export const MAX_PAX = 1000

export type VenueFilters = {
  minBudget: number
  maxBudget: number
  minPax: number
  maxPax: number
  location: string
  search: string
  amenities: string[]
}

export const DEFAULT_VENUE_FILTERS: VenueFilters = {
  minBudget: 0,
  maxBudget: MAX_BUDGET,
  minPax: 0,
  maxPax: MAX_PAX,
  location: "",
  search: "",
  amenities: [],
}

type SearchParamSource = URLSearchParams | Record<string, string | string[] | undefined>

function getParam(source: SearchParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? undefined
  }

  const value = source[key]
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function venueFiltersFromSearchParams(source: SearchParamSource): VenueFilters {
  const minBudget = Math.max(0, parseNumber(getParam(source, "minBudget"), DEFAULT_VENUE_FILTERS.minBudget))
  const maxBudget = Math.min(MAX_BUDGET, parseNumber(getParam(source, "maxBudget"), DEFAULT_VENUE_FILTERS.maxBudget))
  const minPax = Math.max(0, parseNumber(getParam(source, "minPax"), DEFAULT_VENUE_FILTERS.minPax))
  const maxPax = Math.min(MAX_PAX, parseNumber(getParam(source, "maxPax"), DEFAULT_VENUE_FILTERS.maxPax))
  const location = (getParam(source, "location") ?? "").trim()
  const search = (getParam(source, "search") ?? "").trim()
  const amenities = (getParam(source, "amenities") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    minBudget: Math.min(minBudget, maxBudget),
    maxBudget: Math.max(maxBudget, minBudget),
    minPax: Math.min(minPax, maxPax),
    maxPax: Math.max(maxPax, minPax),
    location,
    search,
    amenities,
  }
}

export function venueFiltersToSearchParams(filters: VenueFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.search) params.set("search", filters.search)
  if (filters.location) params.set("location", filters.location)
  if (filters.minBudget > DEFAULT_VENUE_FILTERS.minBudget) params.set("minBudget", String(filters.minBudget))
  if (filters.maxBudget < DEFAULT_VENUE_FILTERS.maxBudget) params.set("maxBudget", String(filters.maxBudget))
  if (filters.minPax > DEFAULT_VENUE_FILTERS.minPax) params.set("minPax", String(filters.minPax))
  if (filters.maxPax < DEFAULT_VENUE_FILTERS.maxPax) params.set("maxPax", String(filters.maxPax))
  if (filters.amenities.length > 0) params.set("amenities", filters.amenities.join(","))

  return params
}