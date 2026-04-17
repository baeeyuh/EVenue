"use client"

import { useEffect, useState } from "react"
import { Building2, CalendarCheck2, MessageSquareMore, WalletCards } from "lucide-react"

import { supabaseClient } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type Summary = {
  totalVenues: number
  pendingInquiries: number
  upcomingBookings: number
  estimatedRevenue: number
}

export default function OwnerDashboardContent() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
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
        const response = await fetch("/api/owner/dashboard", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) throw new Error("Failed to fetch owner dashboard")

        const data = (await response.json()) as Summary
        if (!active) return
        setSummary(data)
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [])

  const stats = [
    {
      title: "Total Venues",
      value: summary?.totalVenues ?? 0,
      description: "Active venue listings",
      icon: Building2,
    },
    {
      title: "Pending Inquiries",
      value: summary?.pendingInquiries ?? 0,
      description: "Awaiting your response",
      icon: MessageSquareMore,
    },
    {
      title: "Upcoming Bookings",
      value: summary?.upcomingBookings ?? 0,
      description: "Scheduled events soon",
      icon: CalendarCheck2,
    },
    {
      title: "Estimated Revenue",
      value: `₱${Number(summary?.estimatedRevenue ?? 0).toLocaleString()}`,
      description: "From confirmed bookings",
      icon: WalletCards,
    },
  ]

  return (
    <main className="min-h-screen bg-[#fafaf8] text-foreground">
      <section className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Owner Dashboard
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Monitor your venues, respond to inquiries, and keep track of bookings.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title} className="border-border/60">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div>
                      <CardDescription>{stat.title}</CardDescription>
                      <CardTitle className="mt-2 text-3xl font-semibold tracking-tight">
                        {stat.value}
                      </CardTitle>
                    </div>
                    <div className="rounded-full border border-border/60 bg-muted/40 p-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}