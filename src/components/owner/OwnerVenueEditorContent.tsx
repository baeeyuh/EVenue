"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, MapPin, Users, Layers2, CheckCircle2, ArrowLeftIcon } from "lucide-react"

import { supabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  amenities: string[] | null
  additional_info: string | null
  is_available: boolean | null
  venue_type: string | null
}

type OwnerVenueEditorContentProps = {
  mode: "add" | "edit"
  venueId?: string
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

export default function OwnerVenueEditorContent({ mode, venueId }: OwnerVenueEditorContentProps) {
  const router = useRouter()

  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [capacity, setCapacity] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState("")
  const [description, setDescription] = useState("")
  const [amenitiesText, setAmenitiesText] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [venueType, setVenueType] = useState("")
  const [isAvailable, setIsAvailable] = useState("true")

  const [error, setError] = useState<string | null>(null)

  const title = useMemo(() => (mode === "add" ? "Add Venue" : "Edit Venue"), [mode])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      const token = session?.access_token ?? null
      if (!active) return

      setAccessToken(token)

      if (!token) {
        setError("Please log in to manage your venues")
        setLoading(false)
        return
      }

      if (mode !== "edit") {
        setLoading(false)
        return
      }

      if (!venueId) {
        setError("Missing venue id")
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/owner/venues", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = (await response.json()) as OwnerVenue[] | { message?: string }

        if (!response.ok) {
          throw new Error((data as { message?: string })?.message || "Failed to load venue")
        }

        const venue = (data as OwnerVenue[]).find((item) => item.id === venueId)

        if (!venue) {
          throw new Error("Venue not found")
        }

        if (!active) return

        setName(venue.name)
        setLocation(venue.location ?? "")
        setCapacity(venue.capacity ? String(venue.capacity) : "")
        setPrice(venue.price ? String(venue.price) : "")
        setImage(venue.image ?? "")
        setDescription(venue.description ?? "")
    setAmenitiesText((venue.amenities ?? []).join(", "))
    setAdditionalInfo(venue.additional_info ?? "")
        setVenueType(venue.venue_type ?? "")
        setIsAvailable(venue.is_available === false ? "false" : "true")
      } catch (bootstrapError: unknown) {
        if (!active) return
        setError(getErrorMessage(bootstrapError, "Failed to load venue"))
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [mode, venueId])

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
        ...(mode === "edit" ? { id: venueId } : {}),
        name,
        location,
        capacity: capacity ? Number(capacity) : null,
        price: price ? Number(price) : null,
        image,
        description,
        amenities: amenitiesText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        additionalInfo,
        venueType,
        isAvailable: isAvailable === "true",
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

      const status = mode === "add" ? "created" : "updated"
      router.push(`/dashboard/owner/venues?status=${status}`)
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, `Failed to ${mode} venue`))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] text-foreground">
    <section className="border-b border-border/60 bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Venue Management
        </p>

        <div className="flex items-center justify-between">
          <h1 className="font-serif text-4xl font-light tracking-tight">
            {title}
          </h1>

          <Button
            type="button"
            variant="outline"
            className="rounded-full border-border/60"
            onClick={() => router.push("/dashboard/owner/venues")}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Venues
          </Button>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          {mode === "add"
            ? "Create a complete venue listing with details, media, and pricing."
            : "Update all venue information, including details, image, and availability."}
        </p>
      </div>
    </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Venue information</CardTitle>
            <CardDescription>
              Fill in all fields relevant to how your venue appears to clients.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {loading && <p className="text-sm text-muted-foreground">Loading venue data...</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}

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

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Amenities
                </Label>
                <Input
                  value={amenitiesText}
                  onChange={(e) => setAmenitiesText(e.target.value)}
                  placeholder="Parking, WiFi, Stage, AV System"
                  className="h-11 rounded-xl border-border/60 bg-muted/40"
                />
                <p className="text-xs text-muted-foreground">Separate each amenity with a comma.</p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Additional info section
                </Label>
                <Textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Add venue policies, inclusions, setup notes, ingress/egress reminders, and other details..."
                  className="min-h-24 rounded-xl border-border/60 bg-muted/40"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Button
                variant="outline"
                className="h-11 rounded-full border-border/60"
                onClick={() => router.push("/dashboard/owner/venues")}
              >
                Cancel
              </Button>
              <Button
                className="h-11 rounded-full bg-primary text-white hover:bg-primary/90"
                disabled={saving || loading || !accessToken || !name.trim()}
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
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
