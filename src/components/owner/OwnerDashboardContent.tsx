"use client"

import { useEffect, useState } from "react"
import {
  Building2,
  CalendarCheck2,
  MessageSquareMore,
  Sparkles,
  WalletCards,
} from "lucide-react"

import { supabaseClient } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Summary = {
  totalVenues: number
  pendingInquiries: number
  upcomingBookings: number
  estimatedRevenue: number
}

function formatCurrency(value: number) {
  return `₱${Number(value).toLocaleString()}`
}

export default function OwnerDashboardContent() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setError(null)

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

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string }
            | null
          throw new Error(payload?.message || "Failed to fetch owner dashboard")
        }

        const data = (await response.json()) as Summary
        if (!active) return
        setSummary(data)
      } catch (fetchError: unknown) {
        if (!active) return
        setError(
          fetchError instanceof Error ? fetchError.message : "Failed to fetch owner dashboard"
        )
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
      description: "Active listings currently visible across your venue portfolio.",
      note: "Portfolio footprint",
      icon: Building2,
      accent: "from-primary/[0.12] via-primary/[0.05] to-transparent",
    },
    {
      title: "Pending Inquiries",
      value: summary?.pendingInquiries ?? 0,
      description: "Requests that still need a reply so you can keep momentum moving.",
      note: "Follow-up priority",
      icon: MessageSquareMore,
      accent: "from-sky-100/80 via-primary/[0.03] to-transparent",
    },
    {
      title: "Upcoming Bookings",
      value: summary?.upcomingBookings ?? 0,
      description: "Confirmed events that are approaching and worth preparing for.",
      note: "Events on deck",
      icon: CalendarCheck2,
      accent: "from-emerald-50 via-primary/[0.03] to-transparent",
    },
    {
      title: "Estimated Revenue",
      value: formatCurrency(summary?.estimatedRevenue ?? 0),
      description: "Projected value generated from your confirmed bookings.",
      note: "Confirmed booking value",
      icon: WalletCards,
      accent: "from-amber-50 via-primary/[0.03] to-transparent",
    },
  ]

  const overviewItems = [
    {
      label: "Active listings",
      value: summary?.totalVenues ?? 0,
    },
    {
      label: "Replies needed",
      value: summary?.pendingInquiries ?? 0,
    },
    {
      label: "Upcoming events",
      value: summary?.upcomingBookings ?? 0,
    },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fafaf8] text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-gradient-to-br from-primary/[0.08] via-secondary/40 to-[#fafaf8]" />
      <div className="pointer-events-none absolute -right-16 top-20 -z-10 h-64 w-64 rounded-full bg-primary/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute left-[-4rem] top-[24rem] -z-10 h-56 w-56 rounded-full bg-primary/[0.05] blur-3xl" />

      <section className="border-b border-border/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,360px)] lg:items-end">
          <div className="space-y-5">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/10 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Owner Dashboard
            </p>

            <div className="space-y-3">
              <h1 className="max-w-2xl font-serif text-4xl font-light leading-tight tracking-tight sm:text-5xl">
                Keep your spaces, inquiries, and bookings in one calm view.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Monitor your venue activity at a glance, stay on top of client follow-ups, and
                keep your confirmed events within easy reach on desktop or mobile.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              {overviewItems.map((item) => (
                <div
                  key={item.label}
                  className="min-w-[140px] flex-1 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur sm:flex-none"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_22px_60px_-30px_rgba(2,43,83,0.4)] backdrop-blur sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Portfolio Snapshot
            </p>
            <p className="mt-3 font-serif text-3xl font-light tracking-tight sm:text-4xl">
              {formatCurrency(summary?.estimatedRevenue ?? 0)}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Estimated value from confirmed bookings and the live activity tied to your venue
              listings.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/60 bg-[#fafaf8] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Inquiries
                </p>
                <p className="mt-2 font-serif text-2xl font-light">
                  {summary?.pendingInquiries ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-[#fafaf8] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Bookings
                </p>
                <p className="mt-2 font-serif text-2xl font-light">
                  {summary?.upcomingBookings ?? 0}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Built to stay readable on smaller screens, so key metrics remain visible without
              feeling cramped.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Performance Snapshot
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light tracking-tight">
              Your essentials, at a glance
            </h2>
          </div>

        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className="border-white/80 bg-white/90 shadow-[0_20px_55px_-28px_rgba(2,43,83,0.24)]"
              >
                <CardHeader className="pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
                      <div className="h-10 w-28 animate-pulse rounded-full bg-muted/80" />
                    </div>
                    <div className="h-11 w-11 animate-pulse rounded-2xl bg-muted/80" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-3 w-full animate-pulse rounded-full bg-muted/80" />
                  <div className="h-8 w-28 animate-pulse rounded-full bg-muted/70" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive/20 bg-destructive/5 shadow-none">
            <CardContent className="p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-destructive">
                Dashboard Unavailable
              </p>
              <p className="mt-3 font-serif text-2xl font-light text-foreground">{error}</p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Try refreshing the page in a moment. Once the request succeeds, your summary cards
                will update automatically.
              </p>
            </CardContent>
          </Card>
        ) : !summary ? (
          <Card className="border-border/60 bg-white/90 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Owner Access
              </p>
              <p className="mt-3 font-serif text-2xl font-light">
                Sign in to see your dashboard activity.
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Once you&apos;re logged in, this page will show your live venue count, pending
                inquiries, upcoming bookings, and estimated revenue.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon

              return (
                <Card
                  key={stat.title}
                  className="relative min-h-[220px] border-white/80 bg-white/90 shadow-[0_20px_55px_-28px_rgba(2,43,83,0.24)]"
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent}`}
                  />

                  <CardHeader className="relative pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {stat.title}
                        </CardDescription>
                        <CardTitle className="font-serif text-4xl font-light tracking-tight sm:text-[2.5rem]">
                          {stat.value}
                        </CardTitle>
                      </div>

                      <div className="rounded-2xl border border-primary/10 bg-white/80 p-3 shadow-sm backdrop-blur">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative mt-auto space-y-4">
                    <p className="text-sm leading-6 text-muted-foreground">{stat.description}</p>
                    <div className="h-px w-full bg-border/70" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                      {stat.note}
                    </p>
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