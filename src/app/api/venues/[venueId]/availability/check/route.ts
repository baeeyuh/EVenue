import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function normalizeDateKey(value: string | null | undefined) {
  if (!value) return null
  if (value.length >= 10) {
    return value.slice(0, 10)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function normalizeTime(value: string | null | undefined) {
  if (!value) return null
  const match = /^(\d{2}):(\d{2})(:\d{2})?$/.exec(value)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null

  return `${match[1]}:${match[2]}`
}

function toDateTime(date: string, time: string) {
  return `${date}T${time}:00`
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const date = new Date(year, month - 1, day + days)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function buildDateRange(start: string, end: string) {
  const dates: string[] = []
  let cursor = start
  while (cursor <= end) {
    dates.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return dates
}

export async function GET(
  request: Request,
  context: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await context.params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const startTime = normalizeTime(searchParams.get("startTime"))
    const endTime = normalizeTime(searchParams.get("endTime"))

    const requestedStart = startDate ?? date
    const requestedEnd = endDate ?? requestedStart

    if (!requestedStart) {
      return NextResponse.json({ message: "Date is required" }, { status: 400 })
    }

    const normalizedStart = normalizeDateKey(requestedStart)
    const normalizedEnd = normalizeDateKey(requestedEnd)
    if (!normalizedStart || !normalizedEnd) {
      return NextResponse.json(
        { message: "Invalid date format" },
        { status: 400 }
      )
    }

    if (normalizedEnd < normalizedStart) {
      return NextResponse.json(
        { message: "End date must be on or after start date" },
        { status: 400 }
      )
    }

    let venueLookup = await supabaseServer
      .from("venues")
      .select("id, is_available, check_in_time, check_out_time")
      .eq("id", venueId)
      .maybeSingle()
    const lookupErrorText = `${venueLookup.error?.message ?? ""}`.toLowerCase()

    if (venueLookup.error && (lookupErrorText.includes("check_in_time") || lookupErrorText.includes("check_out_time"))) {
      venueLookup = await supabaseServer
        .from("venues")
        .select("id, is_available")
        .eq("id", venueId)
        .maybeSingle()
    }

    if (venueLookup.error) {
      throw new Error(venueLookup.error.message)
    }

    if (!venueLookup.data) {
      return NextResponse.json({ message: "Venue not found" }, { status: 404 })
    }

    const venue = venueLookup.data as {
      is_available: boolean | null
      check_in_time?: string | null
      check_out_time?: string | null
    }

    if (venue.is_available === false) {
      return NextResponse.json({ isAvailable: false })
    }

    const overrideLookup = await supabaseServer
      .from("venue_date_availability")
      .select("date, is_available")
      .eq("venue_id", venueId)
      .gte("date", normalizedStart)
      .lte("date", normalizedEnd)

    if (!overrideLookup.error) {
      const overrides = new Map(
        ((overrideLookup.data ?? []) as Array<{ date: string; is_available: boolean }>).map((item) => [
          normalizeDateKey(item.date) ?? item.date,
          item.is_available,
        ])
      )
      const selectedDates = buildDateRange(normalizedStart, normalizedEnd)
      if (selectedDates.some((dateKey) => overrides.get(dateKey) === false)) {
        return NextResponse.json({ isAvailable: false })
      }
    }

    const resolvedStartTime = startTime ?? normalizeTime(venue.check_in_time) ?? "00:00"
    const resolvedEndTime = endTime ?? normalizeTime(venue.check_out_time) ?? "23:59"
    const normalizedEndDateForTime =
      normalizedStart === normalizedEnd && resolvedEndTime <= resolvedStartTime
        ? addDays(normalizedEnd, 1)
        : normalizedEnd

    const requestedStartDateTime = toDateTime(normalizedStart, resolvedStartTime)
    const requestedEndDateTime = toDateTime(normalizedEndDateForTime, resolvedEndTime)

    const { data, error } = await supabaseServer
      .from("bookings")
      .select("id")
      .eq("venue_id", venueId)
      .in("status", ["pending", "confirmed", "Pending", "Confirmed"])
      .lt("start_date", requestedEndDateTime)
      .gt("end_date", requestedStartDateTime)
      .limit(1)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      isAvailable: (data?.length ?? 0) === 0,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { message: getErrorMessage(error, "Failed to check date availability") },
      { status: 500 }
    )
  }
}
