"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, MapPin, Users, Layers2, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type OwnerVenue = {
  id: string
  name: string
  location: string | null
  capacity: number | null
  price: number | null
  image: string | null
  description: string | null
  is_available: boolean | null
  venue_type: string | null
}

type OwnerVenueFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  accessToken: string | null
  venue?: OwnerVenue | null
  onSaved: (venue: OwnerVenue) => void
}

const VENUE_TYPES = [
  "Event Hall",
  "Ballroom",
  "Garden Venue",
  "Rooftop",
  "Hotel Function Room",
  "Resort",
  "Conference Space",
  "Private Dining",
]

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function OwnerVenueFormModal({
  open,
  onOpenChange,
  mode,
  accessToken,
  venue,
  onSaved,
}: OwnerVenueFormModalProps) {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [capacity, setCapacity] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState("")
  const [description, setDescription] = useState("")
  const [venueType, setVenueType] = useState("")
  const [isAvailable, setIsAvailable] = useState("true")

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    if (mode === "edit" && venue) {
      setName(venue.name)
      setLocation(venue.location ?? "")
      setCapacity(venue.capacity ? String(venue.capacity) : "")
  setPrice(venue.price ? String(venue.price) : "")
  setImage(venue.image ?? "")
  setDescription(venue.description ?? "")
      setVenueType(venue.venue_type ?? "")
      setIsAvailable(venue.is_available === false ? "false" : "true")
      return
    }

    setName("")
    setLocation("")
    setCapacity("")
    setPrice("")
    setImage("")
    setDescription("")
    setVenueType("")
    setIsAvailable("true")
  }, [mode, open, venue])

  const title = useMemo(() => (mode === "add" ? "Add venue" : "Edit venue"), [mode])

  const submitDisabled =
    saving || !accessToken || !name.trim() || (mode === "edit" && !venue?.id)

  async function handleSubmit() {
    if (!accessToken) {
      setError("Please log in to continue")
      return
    }

    if (!name.trim()) {
      setError("Venue name is required")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = {
        ...(mode === "edit" ? { id: venue?.id } : {}),
        name,
        location,
        capacity: capacity ? Number(capacity) : null,
        price: price ? Number(price) : null,
        image,
        description,
        venueType,
        isAvailable: mode === "add" ? true : isAvailable === "true",
      }

      const response = await fetch("/api/owner/venues", {
        method: mode === "add" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as OwnerVenue | { message?: string }

      if (!response.ok) {
        throw new Error((data as { message?: string })?.message || `Failed to ${mode} venue`)
      }

      onSaved(data as OwnerVenue)
      onOpenChange(false)
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, `Failed to ${mode} venue`))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-[2rem] border-border/60 p-0">
        <div className="border-b border-border/60 bg-linear-to-br from-primary/8 via-background to-background px-6 py-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="font-serif text-2xl font-light">{title}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {mode === "add"
                ? "Create a new venue listing and make it visible to clients."
                : "Update this venue’s details and availability status."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Venue name
              </Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Grand Ballroom"
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Location
              </Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Cagayan de Oro City"
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Capacity (pax)
              </Label>
              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="150"
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Starting price (₱)
              </Label>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="50000"
                className="h-11 rounded-xl border-border/60 bg-muted/40"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Image URL
              </Label>
              <Input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="h-11 rounded-xl border-border/60 bg-muted/40"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Description
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your venue, setup flexibility, ambiance, and ideal events..."
                className="min-h-28 rounded-xl border-border/60 bg-muted/40"
              />
            </div>

            <div className="rounded-[1.25rem] border border-border/60 bg-muted/30 p-4 md:col-span-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Additional info</p>
              <p className="mt-2 text-sm text-muted-foreground">
                This listing will also show venue type, capacity, availability, and starting price in the
                venue details panel for clients.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Venue type
              </Label>
              <Select value={venueType} onValueChange={setVenueType}>
                <SelectTrigger className="h-11 w-full rounded-xl border-border/60 bg-muted/40">
                  <SelectValue placeholder="Select venue type" />
                </SelectTrigger>
                <SelectContent>
                  {VENUE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center gap-2">
                        <Layers2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {type}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === "edit" && (
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Availability
                </Label>
                <Select value={isAvailable} onValueChange={setIsAvailable}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-border/60 bg-muted/40">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Available
                      </span>
                    </SelectItem>
                    <SelectItem value="false">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-destructive" />
                        Unavailable
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            <Button
              variant="outline"
              className="h-11 rounded-full border-border/60"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-11 rounded-full bg-primary text-white hover:bg-primary/90"
              disabled={submitDisabled}
              onClick={() => {
                void handleSubmit()
              }}
            >
              {saving
                ? mode === "add"
                  ? "Creating..."
                  : "Saving..."
                : mode === "add"
                ? "Create Venue"
                : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
