"use client"

import { BellRing, CalendarDays, CheckCircle2 } from "lucide-react"

import { useBookingNotifications } from "@/hooks/useBookingNotifications"
import type { FollowUpAudience } from "@/lib/booking-followups"

type BookingNotificationsContentProps = {
  role: FollowUpAudience
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "Date unavailable"

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export default function BookingNotificationsContent({ role }: BookingNotificationsContentProps) {
  const { dueItems, dueCount, loading, error } = useBookingNotifications(role, true)

  return (
    <main className="min-h-screen bg-[#fafaf8] text-foreground">
      <section className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Booking Notifications
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight">Notifications</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Follow-ups that need your attention for confirmed bookings.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-4 px-6 py-10">
        {loading && <p className="text-sm text-muted-foreground">Loading notifications...</p>}

        {error && !loading && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && dueCount === 0 && (
          <div className="rounded-2xl border border-border/60 bg-background p-8 text-center">
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              No due reminders right now.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          dueItems.map((item) => (
            <article key={`${item.bookingId}-${item.title}-${item.dueAt}`} className="rounded-2xl border border-border/60 bg-background p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {item.bookingCode} • {item.venueName}
              </p>

              <h2 className="mt-2 inline-flex items-center gap-2 font-serif text-2xl font-light text-foreground">
                <BellRing className="h-5 w-5 text-amber-600" />
                {item.title}
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>

              <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Due {formatDate(item.dueAt)}
              </p>
            </article>
          ))}
      </section>
    </main>
  )
}
