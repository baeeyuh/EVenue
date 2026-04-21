"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type AvailabilityItem = {
  date: string
  isAvailable: boolean
}

type OwnerVenueAvailabilityModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  venueId: string
  venueName: string
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildCalendarDays(viewDate: Date) {
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)

  const startDay = monthStart.getDay()
  const totalDays = monthEnd.getDate()

  const days: Array<Date | null> = []

  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }

  for (let day = 1; day <= totalDays; day++) {
    days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))
  }

  return days
}

export default function OwnerVenueAvailabilityModal({
  open,
  onOpenChange,
  venueId,
  venueName,
}: OwnerVenueAvailabilityModalProps) {
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()))
  const [availability, setAvailability] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    let ignore = false

    async function loadAvailability() {
      setLoading(true)
      setError(null)

      try {
        const month = viewDate.getMonth() + 1
        const year = viewDate.getFullYear()

        const encodedVenueId = encodeURIComponent(venueId)

        const response = await fetch(
          `/api/venues/${encodedVenueId}/availability?year=${year}&month=${month}`,
          {
            method: "GET",
            cache: "no-store",
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load availability")
        }

        if (!ignore) {
          const mapped: Record<string, boolean> = {}
          for (const item of (data.availability ?? []) as AvailabilityItem[]) {
            mapped[item.date] = item.isAvailable
          }
          setAvailability(mapped)
        }
      } catch (loadError: unknown) {
        if (!ignore) {
          setError(getErrorMessage(loadError, "Failed to load availability"))
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void loadAvailability()

    return () => {
      ignore = true
    }
  }, [open, venueId, viewDate])

  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate])

  const stats = useMemo(() => {
    const values = Object.values(availability)
    const available = values.filter(Boolean).length
    return {
      available,
      unavailable: values.length - available,
    }
  }, [availability])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-[2rem] border-border/60 p-0">
        <div className="border-b border-border/60 bg-linear-to-br from-primary/8 via-background to-background px-6 py-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="font-serif text-2xl font-light">View availability</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Monthly availability for <span className="font-medium text-foreground">{venueName}</span>.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 rounded-[1.5rem] border border-border/60 bg-muted/30 p-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Available dates</p>
              <p className="mt-1 font-serif text-2xl font-light text-foreground">{stats.available}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Unavailable dates</p>
              <p className="mt-1 font-serif text-2xl font-light text-foreground">{stats.unavailable}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full border-border/60"
              onClick={() => setViewDate((prev) => addMonths(prev, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h3 className="font-serif text-xl">{formatMonthYear(viewDate)}</h3>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full border-border/60"
              onClick={() => setViewDate((prev) => addMonths(prev, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const key = formatDateKey(day)
              const isAvailable = availability[key] === true
              const isUnavailable = availability[key] === false

              return (
                <div
                  key={key}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-2xl border text-sm",
                    isAvailable && "border-emerald-200 bg-emerald-50 text-emerald-700",
                    isUnavailable && "border-border/60 bg-muted/40 text-muted-foreground",
                    !isAvailable && !isUnavailable && "border-border/40 bg-background"
                  )}
                >
                  {day.getDate()}
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Available</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-border/40 bg-muted" />
              <span className="text-muted-foreground">Unavailable</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-border/40 bg-background" />
              <span className="text-muted-foreground">No status set</span>
            </div>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading availability...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 w-full rounded-full border-border/60"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
