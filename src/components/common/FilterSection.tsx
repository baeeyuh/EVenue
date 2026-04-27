"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Search,
  Users,
  Wallet,
  MapPin,
  Check,
  ChevronsUpDown,
  ChevronDown,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import {
  MAX_BUDGET,
  MAX_PAX,
  type VenueFilters,
  venueFiltersToSearchParams,
} from "@/lib/venue-filters"

const locations = [
  { value: "", label: "All locations" },
  { value: "Cagayan de Oro", label: "Cagayan de Oro" },
  { value: "Iligan City", label: "Iligan City" },
  { value: "Bukidnon", label: "Bukidnon" },
  { value: "Davao City", label: "Davao City" },
  { value: "Cebu City", label: "Cebu City" },
  { value: "Metro Manila", label: "Metro Manila" },
]

const amenities = [
  "Parking", "Stage", "Catering", "AV System",
  "WiFi", "Rooftop", "Garden", "Pool",
]

type FilterSectionProps = {
  initialFilters: VenueFilters
}

export default function FilterSection({ initialFilters }: FilterSectionProps) {
  const stateKey = [
    initialFilters.search,
    initialFilters.location,
    initialFilters.minBudget,
    initialFilters.maxBudget,
    initialFilters.minPax,
    initialFilters.maxPax,
    initialFilters.amenities.join("|"),
  ].join("::")

  return <FilterSectionContent key={stateKey} initialFilters={initialFilters} />
}

function FilterSectionContent({ initialFilters }: FilterSectionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(initialFilters.search)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialFilters.amenities)
  const [locationOpen, setLocationOpen] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true)
  const [location, setLocation] = useState(initialFilters.location)
  const [budgetRange, setBudgetRange] = useState<[number, number]>([initialFilters.minBudget, initialFilters.maxBudget])
  const [paxRange, setPaxRange] = useState<[number, number]>([initialFilters.minPax, initialFilters.maxPax])
  const isExplorePage = pathname.startsWith("/explore")

  useEffect(() => {
    if (!isExplorePage) return

    const updateFromBreakpoint = () => {
      setShowAdvancedFilters(window.innerWidth >= 1024)
    }

    updateFromBreakpoint()
    window.addEventListener("resize", updateFromBreakpoint)

    return () => window.removeEventListener("resize", updateFromBreakpoint)
  }, [isExplorePage])

  const toggleAmenity = (a: string) =>
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((i) => i !== a) : [...prev, a]
    )

  useEffect(() => {
    const timeout = setTimeout(() => {
      const nextParams = venueFiltersToSearchParams({
        search,
        location,
        amenities: selectedAmenities,
        minBudget: budgetRange[0],
        maxBudget: budgetRange[1],
        minPax: paxRange[0],
        maxPax: paxRange[1],
      }).toString()

      const currentParams = searchParams.toString()

      if (nextParams !== currentParams) {
        router.replace(nextParams ? `${pathname}?${nextParams}` : pathname, { scroll: false })
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [search, location, selectedAmenities, budgetRange, paxRange, router, pathname, searchParams])

  const selectedLabel = locations.find((l) => l.value === location)?.label

  return (
    <section className={cn("mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-12", isExplorePage && "pt-2")}> 
      <div
        className={cn(
          "rounded-3xl border border-border/60 bg-card p-5 shadow-sm",
          isExplorePage && "rounded-2xl p-3 shadow-sm sm:p-4"
        )}
      >
        <div
          className={cn(
            "space-y-3",
            isExplorePage && "sticky z-30 -mx-1 border-b border-border/60 bg-card/95 px-1 pb-2 backdrop-blur-xl"
          )}
          style={
            isExplorePage
              ? {
                  top: "calc(var(--app-navbar-height, 0px) + var(--explore-switch-height, 0px) + 0.25rem)",
                }
              : undefined
          }
        >
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-2xl border-border/60 bg-background pl-9 text-sm"
            />
          </div>

          {isExplorePage && (
            <div className="flex items-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                aria-expanded={showAdvancedFilters}
                className="h-7 gap-1 rounded-md px-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                <span>{showAdvancedFilters ? "Hide filters" : "Show filters"}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    showAdvancedFilters && "rotate-180"
                  )}
                />
              </Button>
            </div>
          )}
        </div>

        {showAdvancedFilters && (
          <div className="mt-4 space-y-4">
            {/* Row 1 — Location + Inputs */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {/* Location combobox */}
              <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="h-10 w-full justify-between rounded-2xl border-border/60 bg-background px-3.5 text-sm font-normal"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className={cn(!selectedLabel && "text-muted-foreground")}>
                        {selectedLabel ?? "All locations"}
                      </span>
                    </div>
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 rounded-2xl p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search location..." className="text-sm" />
                    <CommandList>
                      <CommandEmpty>No location found.</CommandEmpty>
                      <CommandGroup>
                        {locations.map((loc) => (
                          <CommandItem
                            key={loc.value}
                            value={loc.value}
                            onSelect={(val) => {
                              setLocation(val === location ? "" : val)
                              setLocationOpen(false)
                            }}
                            className="text-sm"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                location === loc.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {loc.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Budget range inputs */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                  <Input
                    type="number"
                    placeholder="Min budget"
                    value={budgetRange[0] === 0 ? "" : budgetRange[0]}
                    onChange={(e) => {
                      const nextMin = Number(e.target.value) || 0
                      setBudgetRange([Math.min(nextMin, budgetRange[1]), budgetRange[1]])
                    }}
                    className="h-10 rounded-2xl border-border/60 bg-background pl-6 text-sm"
                  />
                </div>
                <span className="text-xs text-muted-foreground">—</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                  <Input
                    type="number"
                    placeholder="Max budget"
                    value={budgetRange[1] === MAX_BUDGET ? "" : budgetRange[1]}
                    onChange={(e) => {
                      const nextMax = Number(e.target.value) || MAX_BUDGET
                      setBudgetRange([budgetRange[0], Math.max(nextMax, budgetRange[0])])
                    }}
                    className="h-10 rounded-2xl border-border/60 bg-background pl-6 text-sm"
                  />
                </div>
              </div>

              {/* Pax range inputs */}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min pax"
                  value={paxRange[0] === 0 ? "" : paxRange[0]}
                  onChange={(e) => {
                    const nextMin = Number(e.target.value) || 0
                    setPaxRange([Math.min(nextMin, paxRange[1]), paxRange[1]])
                  }}
                  className="h-10 rounded-2xl border-border/60 bg-background text-sm"
                />
                <span className="text-xs text-muted-foreground">—</span>
                <Input
                  type="number"
                  placeholder="Max pax"
                  value={paxRange[1] === MAX_PAX ? "" : paxRange[1]}
                  onChange={(e) => {
                    const nextMax = Number(e.target.value) || MAX_PAX
                    setPaxRange([paxRange[0], Math.max(nextMax, paxRange[0])])
                  }}
                  className="h-10 rounded-2xl border-border/60 bg-background text-sm"
                />
              </div>
            </div>

            {/* Row 2 — Sliders */}
            <div className="grid gap-4 px-1 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Budget</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    ₱{budgetRange[0].toLocaleString()} — {budgetRange[1] === MAX_BUDGET ? "Any" : `₱${budgetRange[1].toLocaleString()}`}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={MAX_BUDGET}
                  step={1000}
                  value={budgetRange}
                  onValueChange={(v) => setBudgetRange([v[0], v[1]])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Capacity</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {paxRange[0]} — {paxRange[1] === MAX_PAX ? "Any" : paxRange[1]} pax
                  </span>
                </div>
                <Slider
                  min={0}
                  max={MAX_PAX}
                  step={10}
                  value={paxRange}
                  onValueChange={(v) => setPaxRange([v[0], v[1]])}
                />
              </div>
            </div>

            {/* Row 3 — Amenities */}
            <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
              <span className="mr-1 text-[10px] uppercase tracking-widest text-muted-foreground">Amenities</span>
              {amenities.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity)
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {amenity}
                  </button>
                )
              })}
              {selectedAmenities.length > 0 && (
                <button
                  onClick={() => setSelectedAmenities([])}
                  className="ml-auto text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}