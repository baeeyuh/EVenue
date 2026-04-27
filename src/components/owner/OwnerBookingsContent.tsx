"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { supabaseClient } from "@/lib/supabaseClient"
import BookingDetailsModal from "@/components/common/BookingDetailsModal"
import { getBookingDetails } from "@/lib/services/details/client"
import type { BookingDetails } from "@/lib/services/details/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type OwnerBooking = {
  id: string
  code: string | null
  inquiry_id: string | null
  venue_id: string | null
  venue_name: string
  client_id: string | null
  event_type: string | null
  event_date: string | null
  end_date: string | null
  guest_count: number | null
  status: string | null
  price: number | null
  created_at: string | null
  inquiry_message: string | null
}

function formatDate(value: string | null) {
  if (!value) return "Date not set"

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function getStatusClasses(status: string | null) {
  const s = (status ?? "").toLowerCase()

  if (s === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (s === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  if (s === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  return "border-border/60 bg-muted/40 text-muted-foreground"
}

export default function OwnerBookingsContent() {
  const [bookings, setBookings] = useState<OwnerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(null)
  const [detailsCache, setDetailsCache] = useState<Record<string, BookingDetails>>({})
  const [openingBookingId, setOpeningBookingId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadBookings() {
      setLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      const accessToken = session?.access_token

      if (!accessToken) {
        if (!active) return
        setLoading(false)
        setError("Please log in to view bookings")
        return
      }

      try {
        const response = await fetch("/api/owner/bookings", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch owner bookings")
        }

        const data = (await response.json()) as OwnerBooking[]

        if (!active) return
        setBookings(data)
      } catch (fetchError: unknown) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch bookings")
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    void loadBookings()

    return () => {
      active = false
    }
  }, [])

  async function handleOpen(bookingId: string) {
    const cached = detailsCache[bookingId]

    if (cached) {
      setSelectedBooking(cached)
      return
    }

    setOpeningBookingId(bookingId)

    try {
      const booking = await getBookingDetails(bookingId, "owner")
      setDetailsCache((prev) => ({ ...prev, [bookingId]: booking }))
      setSelectedBooking(booking)
    } catch (detailsFetchError: unknown) {
      const message =
        detailsFetchError instanceof Error
          ? detailsFetchError.message
          : "Failed to load booking details"
      toast.error("Unable to load booking details", { description: message })
    } finally {
      setOpeningBookingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] text-foreground">
      <section className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Bookings Overview
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight">Bookings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Keep track of venue reservations and upcoming events.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-4 px-6 py-10">
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="h-28 animate-pulse border-border/60 bg-muted" />
            ))}
          </div>
        )}

        {error && !loading && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && bookings.length === 0 && (
          <Card className="border-border/60">
            <CardContent className="p-10 text-center">
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            </CardContent>
          </Card>
        )}

        {!loading &&
          !error &&
          bookings.map((booking) => (
            <Card key={booking.id} className="border-border/60">
              <CardContent className="space-y-3 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-serif text-2xl font-light">
                      {booking.venue_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Booking code: {booking.code ?? booking.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${getStatusClasses(
                      booking.status
                    )}`}
                  >
                    {booking.status ?? "Unknown"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span>Scheduled on {formatDate(booking.event_date)}</span>
                  <span>Guests: {booking.guest_count ?? 0}</span>
                  <span>
                    Revenue: ₱{Number(booking.price ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-border/60"
                    onClick={() => void handleOpen(booking.id)}
                    disabled={openingBookingId === booking.id}
                  >
                    {openingBookingId === booking.id ? "Loading..." : "View Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </section>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          open={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </main>
  )
}