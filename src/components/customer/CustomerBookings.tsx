import { CalendarCheck, MapPin, Clock, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const mockBookings = [
  {
    id: "b1",
    venueName: "Glasshaus Events Place",
    location: "Cagayan de Oro City",
    eventDate: "December 15, 2025",
    status: "Confirmed" as const,
  },
  {
    id: "b2",
    venueName: "Azure Hall",
    location: "Iligan City",
    eventDate: "January 20, 2026",
    status: "Pending" as const,
  },
  {
    id: "b3",
    venueName: "Villa Reyes Garden",
    location: "Davao City",
    eventDate: "November 5, 2025",
    status: "Cancelled" as const,
  },
]

const statusConfig = {
  Confirmed: {
    class: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  Pending: {
    class: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  Cancelled: {
    class: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
}

export default function CustomerBookings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-light">My Bookings</h2>
        <span className="text-xs text-muted-foreground">{mockBookings.length} total</span>
      </div>

      {mockBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/60 rounded-2xl">
          <CalendarCheck className="w-8 h-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No bookings yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Your confirmed bookings will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mockBookings.map((booking) => {
            const status = statusConfig[booking.status]
            const Icon = status.icon
            return (
              <div
                key={booking.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border/60 bg-card hover:border-border transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{booking.venueName}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {booking.location}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarCheck className="w-3 h-3 shrink-0" />
                    {booking.eventDate}
                  </div>
                </div>
                <div className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border self-start sm:self-center shrink-0",
                  status.class
                )}>
                  <Icon className="w-3 h-3" />
                  {booking.status}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}