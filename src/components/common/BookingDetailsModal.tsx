"use client"

import { CalendarDays, Tag, Users } from "lucide-react"

import type { BookingDetails } from "@/lib/services/details/types"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type BookingDetailsModalProps = {
  booking: BookingDetails | null
  open: boolean
  onClose: () => void
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not provided"

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatMessageTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function getStatusStyle(status: string | null) {
  const s = (status ?? "").toLowerCase()

  if (s === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (s === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  return "border-amber-200 bg-amber-50 text-amber-700"
}

function getStatusLabel(status: string | null) {
  if (!status) return "Pending"
  return `${status.charAt(0).toUpperCase()}${status.slice(1).toLowerCase()}`
}

export default function BookingDetailsModal({
  booking,
  open,
  onClose,
}: BookingDetailsModalProps) {
  const eventDate = booking?.event_date ?? booking?.start_date ?? null
  const guestCount = booking?.guest_count ?? booking?.inquiry?.pax ?? null
  const thread = booking?.inquiry?.messages ?? []

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[calc(100%-1rem)] max-h-[92dvh] max-w-2xl overflow-hidden rounded-2xl border-border/60 p-0 sm:max-h-[85vh] sm:rounded-3xl">
        <div className="border-b border-border/60 bg-background px-4 py-4 sm:px-6 sm:py-5">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light">View Details</DialogTitle>
            <DialogDescription>
              Booking summary and message history in one place.
            </DialogDescription>
          </DialogHeader>
        </div>

  <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
          {booking && (
            <>
              <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-xl font-light">{booking.venue.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {booking.venue.location ?? "Location not provided"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {formatDate(eventDate)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {guestCount ?? "Not provided"} pax
                      </span>
                    </div>
                  </div>

                  <Badge className={`rounded-full border px-3 py-1 text-xs ${getStatusStyle(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </Badge>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Client:</span> {booking.client.name}
                    {booking.client.email ? ` (${booking.client.email})` : ""}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Owner:</span> {booking.owner.name}
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/60 bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Venue Details
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Venue type</p>
                    <p className="mt-1 text-sm text-foreground">{booking.venue.venue_type ?? "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Capacity</p>
                    <p className="mt-1 text-sm text-foreground">
                      {typeof booking.venue.capacity === "number" ? `${booking.venue.capacity} pax` : "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Starting price</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-foreground">
                      <Tag className="h-3.5 w-3.5" />
                      {typeof booking.venue.price === "number" ? `₱${booking.venue.price.toLocaleString()}` : "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Availability</p>
                    <p className="mt-1 text-sm text-foreground">
                      {booking.venue.is_available === null || booking.venue.is_available === undefined
                        ? "Not set"
                        : booking.venue.is_available
                          ? "Available"
                          : "Unavailable"}
                    </p>
                  </div>
                </div>

                {(booking.venue.description || booking.venue.additional_info) && (
                  <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                    {booking.venue.description && (
                      <p className="text-sm text-muted-foreground">{booking.venue.description}</p>
                    )}
                    {booking.venue.additional_info && (
                      <p className="text-sm text-muted-foreground">{booking.venue.additional_info}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-border/60 bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Message History
                </p>

                <div className="max-h-70 space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-3">
                  {thread.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages available for this booking.</p>
                  ) : (
                    thread.map((item) => {
                      const isClient = item.sender_role === "client"

                      return (
                        <div key={item.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                              isClient
                                ? "bg-primary text-primary-foreground"
                                : "border border-border/60 bg-background text-foreground"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{item.message}</p>
                            <p
                              className={`mt-1 text-[11px] ${
                                isClient ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {item.sender_role === "client" ? "Client" : "Owner"}
                              {item.created_at ? ` • ${formatMessageTime(item.created_at)}` : ""}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
