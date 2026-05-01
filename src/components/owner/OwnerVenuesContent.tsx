"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { supabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import VenueCard from "@/components/common/VenueCard"
import PageSectionHeader from "@/components/common/PageSectionHeader"
import OwnerVenueAvailabilityModal from "@/components/owner/OwnerVenueAvailabilityModal"
import OwnerVenueDeleteDialog from "@/components/owner/OwnerVenueDeleteDialog"

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
  rating?: number | null
  review_count?: number | null
  description: string | null
  check_in_time?: string | null
  check_out_time?: string | null
  allow_custom_hours?: boolean | null
  allow_half_day?: boolean | null
  hourly_rate?: number | null
  half_day_price?: number | null
}

export default function OwnerVenuesContent() {
  const router = useRouter()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [venues, setVenues] = useState<OwnerVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [availabilityVenue, setAvailabilityVenue] = useState<OwnerVenue | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteVenue, setDeleteVenue] = useState<OwnerVenue | null>(null)

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

  async function handleDeleteVenue() {
    if (!accessToken || !deleteVenue) return

    setDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch("/api/owner/venues", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id: deleteVenue.id }),
      })

      const data = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete venue")
      }

      setVenues((currentVenues) => currentVenues.filter((venue) => venue.id !== deleteVenue.id))
      setDeleteOpen(false)
      setDeleteVenue(null)
    } catch (deleteError: unknown) {
      setDeleteError(deleteError instanceof Error ? deleteError.message : "Failed to delete venue")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <main className="min-h-screen bg-[#fafaf8] text-foreground">
        <PageSectionHeader
          eyebrow="Venue Management"
          title="My Venues"
          description="Manage your venue listings, information, and availability."
          maxWidthClassName="max-w-6xl"
        />

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
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:gap-6">
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
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:gap-6">
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
                    rating={Number(venue.rating ?? 0)}
                    reviewCount={venue.review_count ?? 0}
                    ownerName="Your listing"
                    ownerInitials="YL"
                    description={venue.description ?? "No description added yet."}
                    additionalInfo={venue.additional_info ?? undefined}
                    venueType={venue.venue_type ?? "Event Hall"}
                    isAvailable={venue.is_available ?? true}
                    checkInTime={venue.check_in_time ?? undefined}
                    checkOutTime={venue.check_out_time ?? undefined}
                    allowCustomHours={venue.allow_custom_hours ?? false}
                    allowHalfDay={venue.allow_half_day ?? false}
                    hourlyRate={venue.hourly_rate ?? undefined}
                    halfDayPrice={venue.half_day_price ?? undefined}
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
                    onOwnerDelete={(venueId, venueName) => {
                      setDeleteError(null)
                      setDeleteVenue({
                        ...venue,
                        id: venueId,
                        name: venueName,
                      })
                      setDeleteOpen(true)
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

      <OwnerVenueDeleteDialog
        open={deleteOpen}
        venueName={deleteVenue?.name ?? "this venue"}
        deleting={deleting}
        error={deleteError}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) {
            setDeleteError(null)
            setDeleteVenue(null)
          }
        }}
        onConfirm={() => {
          void handleDeleteVenue()
        }}
      />
    </>
  )
}
