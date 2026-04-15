"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/lib/supabaseClient"

type BookingItem = {
  id: string
  code: string | null
  status: string | null
  start_date: string
  end_date: string | null
  venue_name: string
}

function formatBookingDate(startDate: string, endDate: string | null) {
  const start = new Date(startDate)
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  })
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  if (!endDate) return `${dateFormatter.format(start)} at ${timeFormatter.format(start)}`

  const end = new Date(endDate)
  return `${dateFormatter.format(start)} • ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`
}

function normalizeStatus(status: string | null) {
  if (!status) return "Pending"
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

export default function ClientBookingsContent() {
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadBookings() {
      setLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      const user = session?.user
      const accessToken = session?.access_token

      if (!user || !accessToken) {
        if (!active) return
        setBookings([])
        setLoading(false)
        setError("Please log in to view your bookings")
        return
      }

      try {
        const response = await fetch("/api/client/bookings", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to load bookings")
        }

        const data = (await response.json()) as BookingItem[]
        if (!active) return
        setBookings(data)
      } catch (fetchError: unknown) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load bookings")
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-primary">My Bookings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Bookings</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            View your reservation progress, event schedule, and confirmed venue bookings.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading bookings...</p>
        )}

        {error && !loading && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && bookings.length === 0 && (
          <p className="text-sm text-muted-foreground">You have no bookings yet.</p>
        )}

        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {booking.code ?? booking.id}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{booking.venue_name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Event Date: {formatBookingDate(booking.start_date, booking.end_date)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{normalizeStatus(booking.status)}</Badge>
                  <Button variant="outline" className="rounded-full">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
