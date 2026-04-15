"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Mail,
  Phone,
  SendHorizonal,
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

type SendInquiryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  venueId: string
  venueName: string
  venueLocation?: string
  ownerName?: string
  venueCapacity?: number
  initialEventDate?: string
}

export default function SendInquiryModal({
  open,
  onOpenChange,
  venueId,
  venueName,
  venueLocation,
  ownerName,
  venueCapacity,
  initialEventDate,
}: SendInquiryModalProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [eventDate, setEventDate] = useState(initialEventDate ?? "")
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
    }
  }, [initialEventDate, open])

  useEffect(() => {
    let ignore = false

    async function checkDateAvailability() {
      if (!eventDate) {
        setIsDateAvailable(null)
        return
      }

      setDateChecking(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/venues/${venueId}/availability/check?date=${encodeURIComponent(eventDate)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        )

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.message || "Failed to check date availability")
        }

        if (!ignore) {
          setIsDateAvailable(Boolean(data?.isAvailable))
        }
      } catch (err: any) {
        if (!ignore) {
          setIsDateAvailable(null)
          setError(err?.message ?? "Failed to check date availability")
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
  }, [eventDate, venueId])

  const dateStatusText = useMemo(() => {
    if (!eventDate) return null
    if (dateChecking) return "Checking availability..."
    if (isDateAvailable === true) return "This date is available."
    if (isDateAvailable === false) return "This date is not available for this venue."
    return null
  }, [eventDate, dateChecking, isDateAvailable])

  const isDisabled =
    loading ||
    !fullName.trim() ||
    !email.trim() ||
    !eventDate.trim() ||
    !eventType.trim() ||
    !message.trim() ||
    dateChecking ||
    isDateAvailable === false ||
    exceedsCapacity

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isDateAvailable === false) {
        throw new Error("Selected date is not available for this venue")
      }

      if (exceedsCapacity) {
        throw new Error(`Guest count exceeds the venue capacity of ${venueCapacity}`)
      }

      const res = await fetch(`/api/venues/${venueId}/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          contactNumber: contactNumber || undefined,
          eventDate,
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
      setFullName("")
      setEmail("")
      setContactNumber("")
      setEventDate("")
      setStartTime("")
      setEndTime("")
      setGuestCount("")
      setEventType("")
      setMessage("")
      setIsDateAvailable(null)
    } catch (err: any) {
      setError(err?.message ?? "Failed to send inquiry")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-[2rem] border-border/60 p-0">
        <div className="border-b border-border/60 bg-gradient-to-br from-primary/8 via-background to-background px-6 py-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="font-serif text-2xl font-light">
              Send inquiry
            </DialogTitle>

            <DialogDescription className="text-sm text-muted-foreground">
              Contact <span className="font-medium text-foreground">{ownerName || "the host"}</span>{" "}
              about <span className="font-medium text-foreground">{venueName}</span>.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Full name
              </Label>
              <div className="relative">
                <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Juan dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Contact number
              </Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Event date
              </Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                />
              </div>
              {dateStatusText && (
                <p
                  className={`text-xs ${
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

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Guest count
              </Label>
              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 150"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                />
              </div>
              {exceedsCapacity && (
                <p className="text-xs text-destructive">
                  Guest count exceeds the venue capacity of {venueCapacity}.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Start time
              </Label>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                End time
              </Label>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Event type
            </Label>
            <Input
              placeholder="Wedding, debut, seminar, corporate event..."
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="h-11 rounded-xl border-border/60 bg-muted/40"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Message / special requests
            </Label>
            <textarea
              placeholder="Tell the host about your event, setup, inclusions you need, styling, catering, sound system, or other requests..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[140px] w-full rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-full border-border/60"
            >
              Close
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isDisabled}
              className="h-11 rounded-full bg-primary text-white hover:bg-primary/90"
            >
              <SendHorizonal className="mr-2 h-4 w-4" />
              {loading ? "Sending..." : "Send Inquiry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}