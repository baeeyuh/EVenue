"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Mail,
  Phone,
  SendHorizontal,
  User2,
  CalendarDays,
  Users,
  Clock3,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabaseClient } from "@/lib/supabaseClient"
import { toast } from "sonner"

type SendInquiryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  venueId: string
  venueName: string
  venueLocation?: string
  ownerName?: string
  venueCapacity?: number
  initialEventDate?: string
  initialEventEndDate?: string
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function SendInquiryModal({
  open,
  onOpenChange,
  venueId,
  venueName,
  ownerName,
  venueCapacity,
  initialEventDate,
  initialEventEndDate,
}: SendInquiryModalProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [eventDate, setEventDate] = useState(initialEventDate ?? "")
  const [endDate, setEndDate] = useState(initialEventEndDate ?? "")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [guestCount, setGuestCount] = useState("")
  const [eventType, setEventType] = useState("")
  const [message, setMessage] = useState("")

  const [dateChecking, setDateChecking] = useState(false)
  const [isDateAvailable, setIsDateAvailable] = useState<boolean | null>(null)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const guestCountNumber = guestCount ? Number(guestCount) : null
  const exceedsCapacity =
    typeof venueCapacity === "number" &&
    venueCapacity > 0 &&
    guestCountNumber !== null &&
    guestCountNumber > venueCapacity

  useEffect(() => {
    if (open) {
      setEventDate(initialEventDate ?? "")
      setEndDate(initialEventEndDate ?? "")
    }
  }, [initialEventDate, initialEventEndDate, open])

  useEffect(() => {
    let ignore = false

    async function checkDateAvailability() {
      if (!eventDate) {
        setIsDateAvailable(null)
        return
      }

      if (endDate && endDate < eventDate) {
        setIsDateAvailable(null)
        setError("End date must be on or after the start date")
        return
      }

      setDateChecking(true)
      setError(null)

      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()
        const accessToken = session?.access_token
        const encodedVenueId = encodeURIComponent(venueId)

        const rangeEnd = endDate || eventDate
        const res = await fetch(
          `/api/venues/${encodedVenueId}/availability/check?startDate=${encodeURIComponent(eventDate)}&endDate=${encodeURIComponent(rangeEnd)}`,
          {
            method: "GET",
            cache: "no-store",
            headers: accessToken
              ? {
                  Authorization: `Bearer ${accessToken}`,
                }
              : undefined,
          }
        )

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.message || "Failed to check date availability")
        }

        if (!ignore) {
          setIsDateAvailable(Boolean(data?.isAvailable))
        }
      } catch (err: unknown) {
        if (!ignore) {
          setIsDateAvailable(null)
          setError(getErrorMessage(err, "Failed to check date availability"))
        }
      } finally {
        if (!ignore) {
          setDateChecking(false)
        }
      }
    }

    checkDateAvailability()

    return () => {
      ignore = true
    }
  }, [eventDate, endDate, venueId])

  const dateStatusText = useMemo(() => {
    if (!eventDate) return null
    if (dateChecking) return "Checking availability..."
    if (isDateAvailable === true) {
      return endDate && endDate !== eventDate
        ? "This date range is available."
        : "This date is available."
    }
    if (isDateAvailable === false) {
      return endDate && endDate !== eventDate
        ? "This date range is not available for this venue."
        : "This date is not available for this venue."
    }
    return null
  }, [eventDate, endDate, dateChecking, isDateAvailable])

  const isInvalidRange = Boolean(endDate && endDate < eventDate)

  const isDisabled =
    loading ||
    !fullName.trim() ||
    !email.trim() ||
    !eventDate.trim() ||
    !eventType.trim() ||
    !message.trim() ||
    dateChecking ||
    isDateAvailable === false ||
    isInvalidRange ||
    exceedsCapacity

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isDateAvailable === false) {
        throw new Error("Selected date is not available for this venue")
      }

      if (isInvalidRange) {
        throw new Error("End date must be on or after the start date")
      }

      if (exceedsCapacity) {
        throw new Error(`Guest count exceeds the venue capacity of ${venueCapacity}`)
      }

      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error("Please log in to send an inquiry")
      }

      const encodedVenueId = encodeURIComponent(venueId)

      const res = await fetch(`/api/venues/${encodedVenueId}/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          venueName,
          contactNumber: contactNumber || undefined,
          eventDate,
          endDate: endDate || undefined,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          guestCount: guestCount ? Number(guestCount) : undefined,
          eventType: eventType || undefined,
          message,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Failed to send inquiry")
      }

      setSuccess("Inquiry sent successfully.")
      toast.success("Inquiry sent", {
        description: "Your inquiry is now pending owner response.",
      })
      setFullName("")
      setEmail("")
      setContactNumber("")
      setEventDate("")
      setEndDate("")
      setStartTime("")
      setEndTime("")
      setGuestCount("")
      setEventType("")
      setMessage("")
      setIsDateAvailable(null)
      onOpenChange(false)
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to send inquiry")
      setError(message)
      toast.error("Failed to send inquiry", {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90svh] w-[calc(100vw-0.75rem)] max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border-border/60 p-0 sm:w-full sm:rounded-[2rem]">
        <div className="shrink-0 border-b border-border/60 bg-linear-to-br from-primary/8 via-background to-background px-4 py-4 sm:px-6 sm:py-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="font-serif text-xl font-light sm:text-2xl">
              Send inquiry
            </DialogTitle>

            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
              Contact <span className="font-medium text-foreground">{ownerName || "the host"}</span>{" "}
              about <span className="font-medium text-foreground">{venueName}</span>.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 space-y-3.5 overflow-y-auto p-4 sm:space-y-5 sm:p-6 no-scrollbar">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            <div className="min-w-0 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                Full name
              </Label>
              <div className="relative">
                <User2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground sm:left-3 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Juan dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 rounded-xl border-border/60 bg-muted/40 pl-8 pr-2 text-[13px] sm:h-11 sm:pl-10 sm:pr-3 sm:text-sm"
                />
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground sm:left-3 sm:h-4 sm:w-4" />
                <Input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl border-border/60 bg-muted/40 pl-8 pr-2 text-[13px] sm:h-11 sm:pl-10 sm:pr-3 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <div className="min-w-0 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                Contact No.
              </Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground sm:left-3 sm:h-4 sm:w-4" />
                <Input
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="h-10 rounded-xl border-border/60 bg-muted/40 pl-8 pr-2 text-[13px] sm:h-11 sm:pl-10 sm:pr-3 sm:text-sm"
                />
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                Start date
              </Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground sm:left-3 sm:h-4 sm:w-4" />
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="h-10 rounded-xl border-border/60 bg-muted/40 pl-8 pr-2 text-[13px] sm:h-11 sm:pl-10 sm:pr-3 sm:text-sm"
                />
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                End date
              </Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground sm:left-3 sm:h-4 sm:w-4" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 rounded-xl border-border/60 bg-muted/40 pl-8 pr-2 text-[13px] sm:h-11 sm:pl-10 sm:pr-3 sm:text-sm"
                />
              </div>
              {dateStatusText && (
                <p
                  className={`text-[11px] sm:text-xs ${
                    isDateAvailable === false
                      ? "text-destructive"
                      : isDateAvailable === true
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {dateStatusText}
                </p>
              )}
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                Guest count
              </Label>
              <div className="relative">
                <Users className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground sm:left-3 sm:h-4 sm:w-4" />
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 150"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="h-10 rounded-xl border-border/60 bg-muted/40 pl-8 pr-2 text-[13px] sm:h-11 sm:pl-10 sm:pr-3 sm:text-sm"
                />
              </div>
              {exceedsCapacity && (
                <p className="text-[11px] text-destructive sm:text-xs">
                  Guest count exceeds the venue capacity of {venueCapacity}.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            <div className="min-w-0 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                Start time
              </Label>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground sm:left-3 sm:h-4 sm:w-4" />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-10 rounded-xl border-border/60 bg-muted/40 pl-8 pr-2 text-[13px] sm:h-11 sm:pl-10 sm:pr-3 sm:text-sm"
                />
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                End time
              </Label>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground sm:left-3 sm:h-4 sm:w-4" />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-10 rounded-xl border-border/60 bg-muted/40 pl-8 pr-2 text-[13px] sm:h-11 sm:pl-10 sm:pr-3 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
              Event type
            </Label>
            <Input
              placeholder="Wedding, debut, seminar, corporate event..."
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="h-10 rounded-xl border-border/60 bg-muted/40 px-3 text-[13px] sm:h-11 sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
              Message / special requests
            </Label>
            <textarea
              placeholder="Tell the host about your event, setup, inclusions you need, styling, catering, sound system, or other requests..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] w-full rounded-2xl border border-border/60 bg-muted/40 px-3 py-3 text-[13px] outline-none placeholder:text-muted-foreground focus:border-primary sm:min-h-[140px] sm:px-4 sm:text-sm"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-10 rounded-full border-border/60 px-3 text-xs sm:h-11 sm:text-sm"
            >
              Close
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isDisabled}
              className="h-10 rounded-full bg-primary px-3 text-xs text-white hover:bg-primary/90 sm:h-11 sm:text-sm"
            >
              <SendHorizontal className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              {loading ? "Sending..." : "Send Inquiry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
