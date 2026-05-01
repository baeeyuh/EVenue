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
  checkInTime?: string
  checkOutTime?: string
  fullDayPrice?: string
  allowCustomHours?: boolean
  allowHalfDay?: boolean
  hourlyRate?: number | null
  halfDayPrice?: number | null
  initialEventDate?: string
  initialEventEndDate?: string
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function parsePeso(value?: string) {
  if (!value) return null
  const numberValue = Number(value.replace(/[^\d.]/g, ""))
  return Number.isFinite(numberValue) ? numberValue : null
}

function formatMoney(value: number | null) {
  return typeof value === "number" ? `₱${value.toLocaleString()}` : "Price on request"
}

function hoursBetween(start: string, end: string) {
  if (!start || !end) return null
  const [startHour, startMinute] = start.split(":").map(Number)
  const [endHour, endMinute] = end.split(":").map(Number)
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return null

  const startMinutes = startHour * 60 + startMinute
  let endMinutes = endHour * 60 + endMinute
  if (endMinutes <= startMinutes) endMinutes += 24 * 60
  return (endMinutes - startMinutes) / 60
}

export default function SendInquiryModal({
  open,
  onOpenChange,
  venueId,
  venueName,
  ownerName,
  venueCapacity,
  checkInTime,
  checkOutTime,
  fullDayPrice,
  allowCustomHours,
  allowHalfDay,
  hourlyRate,
  halfDayPrice,
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
  const [bookingType, setBookingType] = useState<"full_day" | "hourly" | "half_day_morning" | "half_day_evening">("full_day")
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
  const fullDayPriceNumber = parsePeso(fullDayPrice)
  const durationHours = hoursBetween(startTime, endTime)
  const calculatedPrice = useMemo(() => {
    if (bookingType === "hourly") {
      if (typeof hourlyRate !== "number" || typeof durationHours !== "number") return null
      const hourlyTotal = hourlyRate * durationHours
      return typeof fullDayPriceNumber === "number"
        ? Math.min(hourlyTotal, fullDayPriceNumber)
        : hourlyTotal
    }

    if (bookingType === "half_day_morning" || bookingType === "half_day_evening") {
      if (typeof halfDayPrice === "number") return halfDayPrice
      return typeof fullDayPriceNumber === "number" ? fullDayPriceNumber / 2 : null
    }

    if (!eventDate) return null
    const start = new Date(`${eventDate}T00:00:00`)
    const end = new Date(`${endDate || eventDate}T00:00:00`)
    const days = Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
      ? 1
      : Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1)
    return typeof fullDayPriceNumber === "number" ? fullDayPriceNumber * days : null
  }, [bookingType, durationHours, hourlyRate, halfDayPrice, fullDayPriceNumber, eventDate, endDate])
  const priceBreakdown =
    bookingType === "hourly"
      ? `${durationHours ?? 0} hours x ${formatMoney(hourlyRate ?? null)}${typeof fullDayPriceNumber === "number" ? "; capped at full-day price" : ""}`
      : bookingType === "half_day_morning"
        ? "Morning half-day slot"
        : bookingType === "half_day_evening"
          ? "Evening half-day slot"
          : "Full-day rate"
  const invalidTimeSelection =
    (bookingType === "hourly" && (!startTime || !endTime || !durationHours || durationHours <= 0)) ||
    ((bookingType === "full_day" ||
      bookingType === "half_day_morning" ||
      bookingType === "half_day_evening") &&
      (!startTime || !endTime))

  useEffect(() => {
    if (bookingType === "full_day") {
      setStartTime(checkInTime?.slice(0, 5) ?? "")
      setEndTime(checkOutTime?.slice(0, 5) ?? "")
      return
    }

    if (bookingType === "half_day_morning") {
      setStartTime(checkInTime?.slice(0, 5) ?? "08:00")
      setEndTime("12:00")
      return
    }

    if (bookingType === "half_day_evening") {
      setStartTime("13:00")
      setEndTime(checkOutTime?.slice(0, 5) ?? "17:00")
    }
  }, [bookingType, checkInTime, checkOutTime])

  useEffect(() => {
    if (open) {
      setEventDate(initialEventDate ?? "")
      setEndDate(initialEventEndDate ?? "")
    }
  }, [initialEventDate, initialEventEndDate, open])

  useEffect(() => {
    let ignore = false

    async function checkDateAvailability() {
      if (!eventDate || invalidTimeSelection) {
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
          `/api/venues/${encodedVenueId}/availability/check?startDate=${encodeURIComponent(eventDate)}&endDate=${encodeURIComponent(rangeEnd)}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`,
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
  }, [eventDate, endDate, venueId, startTime, endTime, invalidTimeSelection])

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
    invalidTimeSelection ||
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
          bookingType,
          durationHours: durationHours ?? undefined,
          priceBreakdown,
          totalPrice: calculatedPrice ?? undefined,
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
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
              Booking type
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { value: "full_day", label: "Full day", enabled: true },
                { value: "hourly", label: "Hourly", enabled: Boolean(allowCustomHours && hourlyRate) },
                { value: "half_day_morning", label: "Morning", enabled: Boolean(allowHalfDay) },
                { value: "half_day_evening", label: "Evening", enabled: Boolean(allowHalfDay) },
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={bookingType === option.value ? "default" : "outline"}
                  disabled={!option.enabled}
                  className="h-10 rounded-full text-xs"
                  onClick={() => setBookingType(option.value as typeof bookingType)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

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
                  disabled={bookingType !== "hourly"}
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
                  disabled={bookingType !== "hourly"}
                  className="h-10 rounded-xl border-border/60 bg-muted/40 pl-8 pr-2 text-[13px] sm:h-11 sm:pl-10 sm:pr-3 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl border border-border/60 bg-muted/25 p-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Time range</p>
              <p className="mt-1 font-medium text-foreground">
                {startTime || "--:--"} to {endTime || "--:--"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Duration</p>
              <p className="mt-1 font-medium text-foreground">
                {typeof durationHours === "number" ? `${durationHours} hours` : "Not calculated"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Price breakdown</p>
              <p className="mt-1 font-medium text-foreground">{priceBreakdown}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Total cost</p>
              <p className="mt-1 font-medium text-foreground">{formatMoney(calculatedPrice)}</p>
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
