"use client"

import { useState } from "react"
import { Search, Users, Wallet, MapPin, Check, ChevronsUpDown } from "lucide-react"
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

const locations = [
  { value: "all", label: "All locations" },
  { value: "cdo", label: "Cagayan de Oro" },
  { value: "iligan", label: "Iligan City" },
  { value: "bukidnon", label: "Bukidnon" },
  { value: "davao", label: "Davao City" },
  { value: "cebu", label: "Cebu City" },
  { value: "manila", label: "Metro Manila" },
]

const amenities = [
  "Parking", "Stage", "Catering", "AV System",
  "WiFi", "Rooftop", "Garden", "Pool",
]

const MAX_BUDGET = 200000
const MAX_PAX = 1000

export default function FilterSection() {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [locationOpen, setLocationOpen] = useState(false)
  const [location, setLocation] = useState("")
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, MAX_BUDGET])
  const [paxRange, setPaxRange] = useState<[number, number]>([0, MAX_PAX])

  const toggleAmenity = (a: string) =>
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((i) => i !== a) : [...prev, a]
    )

  const selectedLabel = locations.find((l) => l.value === location)?.label

  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">

        {/* Row 1 — Search + Location + Inputs */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search venues..."
              className="h-10 rounded-2xl border-border/60 bg-background pl-9 text-sm"
            />
          </div>

          {/* Location combobox */}
          <Popover open={locationOpen} onOpenChange={setLocationOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="h-10 w-full rounded-2xl border-border/60 bg-background justify-between font-normal text-sm px-3.5"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className={cn(!selectedLabel && "text-muted-foreground")}>
                    {selectedLabel ?? "All locations"}
                  </span>
                </div>
                <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 rounded-2xl" align="start">
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
                        <Check className={cn("mr-2 w-4 h-4", location === loc.value ? "opacity-100" : "opacity-0")} />
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
                onChange={(e) => setBudgetRange([Number(e.target.value) || 0, budgetRange[1]])}
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
                onChange={(e) => setBudgetRange([budgetRange[0], Number(e.target.value) || MAX_BUDGET])}
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
              onChange={(e) => setPaxRange([Number(e.target.value) || 0, paxRange[1]])}
              className="h-10 rounded-2xl border-border/60 bg-background text-sm"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <Input
              type="number"
              placeholder="Max pax"
              value={paxRange[1] === MAX_PAX ? "" : paxRange[1]}
              onChange={(e) => setPaxRange([paxRange[0], Number(e.target.value) || MAX_PAX])}
              className="h-10 rounded-2xl border-border/60 bg-background text-sm"
            />
          </div>

        </div>

        {/* Row 2 — Sliders */}
        <div className="grid gap-4 sm:grid-cols-2 mt-4 px-1">
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Budget</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                ₱{budgetRange[0].toLocaleString()} — {budgetRange[1] === MAX_BUDGET ? "Any" : `₱${budgetRange[1].toLocaleString()}`}
              </span>
            </div>
            <Slider
              min={0} max={MAX_BUDGET} step={1000}
              value={budgetRange}
              onValueChange={(v) => setBudgetRange([v[0], v[1]])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Capacity</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {paxRange[0]} — {paxRange[1] === MAX_PAX ? "Any" : paxRange[1]} pax
              </span>
            </div>
            <Slider
              min={0} max={MAX_PAX} step={10}
              value={paxRange}
              onValueChange={(v) => setPaxRange([v[0], v[1]])}
            />
          </div>
        </div>

        {/* Row 3 — Amenities */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/60">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-1">Amenities</span>
          {amenities.map((amenity) => {
            const isSelected = selectedAmenities.includes(amenity)
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
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
    </section>
  )
}