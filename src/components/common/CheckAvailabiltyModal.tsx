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

type CheckAvailabilityModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  venueId: string
  venueName: string
  venueLocation?: string
  onContinue?: (startDate: string, endDate?: string) => void
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

function buildRangeKeys(start: string, end: string) {
  const keys: string[] = []
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return keys

  const cursor = new Date(startDate)
  while (cursor <= endDate) {
    keys.push(formatDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return keys
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
  onContinue,
}: CheckAvailabilityModalProps) {
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()))
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null)
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

        const res = await fetch(
          `/api/venues/${encodedVenueId}/availability?year=${year}&month=${month}`,
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
      } catch (err: unknown) {
        if (!ignore) {
          setError(getErrorMessage(err, "Failed to load availability"))
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
  const rangeKeys = useMemo(() => {
    if (!selectedStart) return []
    if (!selectedEnd) return [selectedStart]
    return buildRangeKeys(selectedStart, selectedEnd)
  }, [selectedStart, selectedEnd])
  const rangeIsAvailable = useMemo(() => {
    if (rangeKeys.length === 0) return false
    return rangeKeys.every((key) => availability[key] === true)
  }, [rangeKeys, availability])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90svh] w-[calc(100vw-0.75rem)] max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border-border/60 p-0 sm:w-full sm:rounded-[2rem]">
        <div className="shrink-0 border-b border-border/60 bg-gradient-to-br from-primary/8 via-background to-background px-4 py-4 sm:px-6 sm:py-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="font-serif text-xl font-light sm:text-2xl">
              Check availability
            </DialogTitle>

            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
              View available dates for{" "}
              <span className="font-medium text-foreground">{venueName}</span>.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6 no-scrollbar">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full border-border/60 sm:h-10 sm:w-10"
              onClick={() => setViewDate((prev) => addMonths(prev, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h3 className="text-center font-serif text-lg leading-tight sm:text-xl">
              {formatMonthYear(viewDate)}
            </h3>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full border-border/60 sm:h-10 sm:w-10"
              onClick={() => setViewDate((prev) => addMonths(prev, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:gap-2 sm:text-xs sm:tracking-[0.16em]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1.5 sm:py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const key = formatDateKey(day)
              const isPast = key < todayKey
              const isAvailable = availability[key] === true
              const isUnavailable = availability[key] === false || isPast
              const isSelectedStart = selectedStart === key
              const isSelectedEnd = selectedEnd === key
              const isInRange = rangeKeys.includes(key)

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    if (!selectedStart || (selectedStart && selectedEnd)) {
                      setSelectedStart(key)
                      setSelectedEnd(null)
                      return
                    }

                    if (key < selectedStart) {
                      setSelectedEnd(selectedStart)
                      setSelectedStart(key)
                      return
                    }

                    setSelectedEnd(key)
                  }}
                  className={cn(
                    "aspect-square rounded-xl border text-xs transition-all sm:rounded-2xl sm:text-sm",
                    (isSelectedStart || isSelectedEnd) &&
                      "border-primary bg-primary text-primary-foreground",
                    !isSelectedStart &&
                      !isSelectedEnd &&
                      isInRange &&
                      "border-primary/40 bg-primary/10 text-foreground",
                    !isSelectedStart &&
                      !isSelectedEnd &&
                      !isInRange &&
                      isAvailable &&
                      "border-border/60 bg-background hover:border-primary/50 hover:bg-primary/5",
                    isUnavailable &&
                      "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground opacity-50"
                  )}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-border/60 bg-background" />
              <span className="text-muted-foreground">Available</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-border/40 bg-muted" />
              <span className="text-muted-foreground">Unavailable</span>
            </div>
          </div>

          {loading && <div className="h-10 animate-pulse rounded-xl bg-muted" />}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {selectedStart && (
            <div className="rounded-[1.25rem] border border-primary/20 bg-primary/5 p-3.5 sm:rounded-[1.5rem] sm:p-4">
              <p className="text-xs text-muted-foreground sm:text-sm">Selected dates</p>
              <p className="mt-1 text-sm font-medium text-foreground sm:text-base">
                {selectedStart}{selectedEnd ? ` to ${selectedEnd}` : ""}
              </p>
            </div>
          )}

          {selectedStart && selectedEnd && !rangeIsAvailable && (
            <p className="text-sm text-destructive">
              One or more dates in this range are unavailable.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-full border-border/60 px-3 text-[11px] sm:h-11 sm:text-sm"
            >
              Close
            </Button>

            <Button
              disabled={!selectedStart || (selectedEnd ? !rangeIsAvailable : false)}
              className="h-10 rounded-full bg-primary px-3 text-[11px] leading-tight text-white hover:bg-primary/90 sm:h-11 sm:text-sm"
              onClick={() => {
                if (selectedStart) {
                  onContinue?.(selectedStart, selectedEnd ?? undefined)
                }
              }}
            >
              Continue with Inquiry
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}