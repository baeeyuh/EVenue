import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const bookings = [
  {
    id: "BK-1001",
    venue: "Grand Horizon Hall",
    date: "May 20, 2026",
    status: "Confirmed",
  },
  {
    id: "BK-1002",
    venue: "Luxe Garden Pavilion",
    date: "June 02, 2026",
    status: "Pending",
  },
]

export default function ClientBookingsContent() {
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
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {booking.id}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{booking.venue}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Event Date: {booking.date}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{booking.status}</Badge>
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
