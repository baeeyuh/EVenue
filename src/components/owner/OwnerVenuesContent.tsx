"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { supabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import VenueCard from "@/components/common/VenueCard"
import OwnerVenueAvailabilityModal from "@/components/owner/OwnerVenueAvailabilityModal"

type OwnerVenue = {
  id: string
  name: string
  location: string | null
  capacity: number | null
  amenities: string[] | null
  additional_info: string | null
  is_available: boolean | null
  venue_type: string | null
  image: string | null
  price: number | null
  description: string | null
}

export default function OwnerVenuesContent() {
  const router = useRouter()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [venues, setVenues] = useState<OwnerVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [availabilityVenue, setAvailabilityVenue] = useState<OwnerVenue | null>(null)

  useEffect(() => {
    let active = true

    async function loadVenues() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      const accessToken = session?.access_token
      if (active) {
        setAccessToken(accessToken ?? null)
      }

      if (!accessToken) {
        if (!active) return
        setError("Please log in to manage your venues")
        setLoading(false)
        return
      }

      try {
        setError(null)

        const response = await fetch("/api/owner/venues", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const data = (await response.json()) as OwnerVenue[] | { message?: string }

        if (!response.ok) {
          throw new Error((data as { message?: string })?.message || "Failed to fetch owner venues")
        }

        if (!active) return
        setVenues(data as OwnerVenue[])
      } catch (loadError: unknown) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : "Failed to fetch owner venues")
        setVenues([])
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    void loadVenues()

    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <main className="min-h-screen bg-[#fafaf8] text-foreground">
        <section className="border-b border-border/60 bg-background">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Venue Management
            </p>
            <h1 className="font-serif text-4xl font-light tracking-tight">My Venues</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Manage your venue listings, information, and availability.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl space-y-4 px-6 py-10">
          <div className="flex justify-end">
            {accessToken ? (
              <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90">
                <Link href="/dashboard/owner/venues/new">Add Venue</Link>
              </Button>
            ) : (
              <Button className="rounded-full bg-primary text-white hover:bg-primary/90" disabled>
                Add Venue
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : error ? (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          ) : venues.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  No venues yet. Create your first listing by clicking Add Venue.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {venues.map((venue) => (
                <div key={venue.id} className="space-y-3">
                  <VenueCard
                    id={venue.id}
                    organizationId=""
                    name={venue.name}
                    location={venue.location ?? "Location not set"}
                    capacity={venue.capacity ?? 0}
                    price={venue.price !== null ? `₱${Number(venue.price).toLocaleString()}` : "Price on request"}
                    image={venue.image ?? "/images/placeholder-venue.jpg"}
                    amenities={venue.amenities ?? []}
                    rating={0}
                    reviewCount={0}
                    ownerName="Your listing"
                    ownerInitials="YL"
                    description={venue.description ?? "No description added yet."}
                    additionalInfo={venue.additional_info ?? undefined}
                    venueType={venue.venue_type ?? "Event Hall"}
                    isAvailable={venue.is_available ?? true}
                    context="owner"
                    onOwnerEdit={(venueId) => {
                      router.push(`/dashboard/owner/venues/${venueId}/edit`)
                    }}
                    onOwnerViewAvailability={(venueId, venueName) => {
                      setAvailabilityVenue({
                        ...venue,
                        id: venueId,
                        name: venueName,
                      })
                      setAvailabilityOpen(true)
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <OwnerVenueAvailabilityModal
        open={availabilityOpen}
        onOpenChange={setAvailabilityOpen}
        venueId={availabilityVenue?.id ?? ""}
        venueName={availabilityVenue?.name ?? "Venue"}
      />
    </>
  )
}