"use client"

import { useEffect, useState } from "react"

import { supabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type OwnerVenue = {
  id: string
  name: string
  location: string | null
  capacity: number | null
  is_available: boolean | null
  venue_type: string | null
}

export default function OwnerVenuesContent() {
  const [venues, setVenues] = useState<OwnerVenue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadVenues() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) {
        if (!active) return
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/owner/venues", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) throw new Error("Failed to fetch owner venues")

        const data = (await response.json()) as OwnerVenue[]
        if (!active) return
        setVenues(data)
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
          <Button className="rounded-full bg-primary text-white hover:bg-primary/90">
            Add Venue
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading venues...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {venues.map((venue) => (
              <Card key={venue.id} className="border-border/60">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-serif text-2xl font-light">{venue.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {venue.location ?? "Location not set"}
                      </p>
                    </div>
                    <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                      {venue.is_available ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Capacity: {venue.capacity ?? 0} pax
                  </p>

                  <div className="flex gap-3">
                    <Button variant="outline" className="rounded-full border-border/60">
                      Edit
                    </Button>
                    <Button variant="outline" className="rounded-full border-border/60">
                      View Availability
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}