"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"

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

type CheckAvailabilityModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  venueId: string
  venueName: string
  venueLocation?: string
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

export default function CheckAvailabilityModal({
  open,
  onOpenChange,
  venueId,
  venueName,
  venueLocation,
}: CheckAvailabilityModalProps) {
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
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

        const res = await fetch(
          `/api/venues/${venueId}/availability?year=${year}&month=${month}`,
          {
            method: "GET",
            cache: "no-store",
          }
        )

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load availability")
        }

        if (!ignore) {
          const mapped: Record<string, boolean> = {}
          for (const item of (data.availability ?? []) as AvailabilityItem[]) {
            mapped[item.date] = item.isAvailable
          }
          setAvailability(mapped)
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err?.message ?? "Failed to load availability")
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadAvailability()

    return () => {
      ignore = true
    }
  }, [open, venueId, viewDate])

  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate])

  const todayKey = formatDateKey(new Date())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-[2rem] border-border/60 p-0">
        <div className="border-b border-border/60 bg-gradient-to-br from-primary/8 via-background to-background px-6 py-5">
          <DialogHeader className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <CalendarDays className="h-3.5 w-3.5" />
              Venue availability
            </div>

            <DialogTitle className="font-serif text-2xl font-light">
              Check availability
            </DialogTitle>

            <DialogDescription className="text-sm text-muted-foreground">
              View available dates for{" "}
              <span className="font-medium text-foreground">{venueName}</span>.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">

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
              const isPast = key < todayKey
              const isAvailable = availability[key] === true
              const isUnavailable = availability[key] === false || isPast
              const isSelected = selectedDate === key

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setSelectedDate(key)}
                  className={cn(
                    "aspect-square rounded-2xl border text-sm transition-all",
                    isSelected && "border-primary bg-primary text-primary-foreground",
                    !isSelected && isAvailable && "border-border/60 bg-background hover:border-primary/50 hover:bg-primary/5",
                    isUnavailable && "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground opacity-50"
                  )}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-background border border-border/60" />
              <span className="text-muted-foreground">Available</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-muted border border-border/40" />
              <span className="text-muted-foreground">Unavailable</span>
            </div>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading availability...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {selectedDate && (
            <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground">Selected date</p>
              <p className="mt-1 font-medium text-foreground">{selectedDate}</p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-full border-border/60"
            >
              Close
            </Button>

            <Button
              disabled={!selectedDate}
              className="h-11 rounded-full bg-primary text-white hover:bg-primary/90"
            >
              Continue with {selectedDate ? "Inquiry" : "Selection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}