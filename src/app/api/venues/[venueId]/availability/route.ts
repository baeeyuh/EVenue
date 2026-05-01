import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"
import { getAuthenticatedOwner } from "@/lib/services/owner/auth"
import { getOwnerOrgIds } from "@/lib/services/owner/organizations"

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function normalizeDateKey(value: string | null | undefined) {
  if (!value) return null
  if (value.length >= 10) {
    return value.slice(0, 10)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return formatDateKey(parsed)
}

export async function GET(
  request: Request,
  context: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await context.params
    const { searchParams } = new URL(request.url)

    const year = Number(searchParams.get("year"))
    const month = Number(searchParams.get("month"))

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { message: "Year and month are required" },
        { status: 400 }
      )
    }

    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0)
    const startDate = formatDateKey(monthStart)
    const endDateString = formatDateKey(monthEnd)

    const { data: venueData, error: venueError } = await supabaseServer
      .from("venues")
      .select("id, is_available")
      .eq("id", venueId)
      .maybeSingle()

    if (venueError) {
      console.error("venue lookup error:", venueError)
      return NextResponse.json(
        { message: venueError.message, details: venueError },
        { status: 500 }
      )
    }

    if (!venueData) {
      return NextResponse.json({ message: "Venue not found" }, { status: 404 })
    }

    const venueIsAvailable = venueData.is_available !== false

    const overridesResult = await supabaseServer
      .from("venue_date_availability")
      .select("date, is_available")
      .eq("venue_id", venueId)
      .gte("date", startDate)
      .lte("date", endDateString)

    const availabilityOverrides = new Map<string, boolean>()

    if (!overridesResult.error) {
      for (const override of (overridesResult.data ?? []) as Array<{ date: string; is_available: boolean }>) {
        availabilityOverrides.set(normalizeDateKey(override.date) ?? override.date, override.is_available)
      }
    }

    const { data: bookingsData, error } = await supabaseServer
      .from("bookings")
      .select("start_date, end_date, status")
      .eq("venue_id", venueId)
      .in("status", ["pending", "confirmed", "Pending", "Confirmed"])
      .lte("start_date", `${endDateString}T23:59:59`)
      .or(`end_date.gte.${startDate},end_date.is.null`)

    if (error) {
      console.error("venue bookings query error:", error)
      return NextResponse.json(
        { message: error.message, details: error },
        { status: 500 }
      )
    }

    const daysInMonth = monthEnd.getDate()
    const availability: Array<{ date: string; isAvailable: boolean }> = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      let isBlocked = false

      for (const booking of bookingsData ?? []) {
        const startKey = normalizeDateKey(booking.start_date)
        const endKey = normalizeDateKey(booking.end_date) ?? startKey

        if (!startKey || !endKey) {
          continue
        }

        if (dateKey >= startKey && dateKey <= endKey) {
          isBlocked = true
          break
        }
      }

      availability.push({
        date: dateKey,
        isAvailable: availabilityOverrides.get(dateKey) ?? (venueIsAvailable && !isBlocked),
      })
    }

    return NextResponse.json({
      availability,
    })
  } catch (error: unknown) {
    console.error("availability route error:", error)
    return NextResponse.json(
      { message: getErrorMessage(error, "Failed to load availability") },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ venueId: string }> }
) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { venueId } = await context.params
    const body = await request.json()
    const date = normalizeDateKey(typeof body?.date === "string" ? body.date : null)
    const isAvailable = typeof body?.isAvailable === "boolean" ? body.isAvailable : null

    if (!date || isAvailable === null) {
      return NextResponse.json({ message: "Date and availability are required" }, { status: 400 })
    }

    const orgIds = await getOwnerOrgIds(client, userId)
    const venueLookup = await client
      .from("venues")
      .select("id, organization_id")
      .eq("id", venueId)
      .maybeSingle()

    const venue = venueLookup.data as { organization_id?: string | null } | null

    if (venueLookup.error || !venue?.organization_id || !orgIds.includes(venue.organization_id)) {
      return NextResponse.json({ message: "Venue not found" }, { status: 404 })
    }

    const upsert = await client
      .from("venue_date_availability")
      .upsert({
        venue_id: venueId,
        date,
        is_available: isAvailable,
        updated_at: new Date().toISOString(),
      })
      .select("date, is_available")
      .single()

    if (upsert.error) {
      throw new Error(upsert.error.message)
    }

    return NextResponse.json({
      date,
      isAvailable,
    })
  } catch (error: unknown) {
    console.error("availability update route error:", error)
    return NextResponse.json(
      { message: getErrorMessage(error, "Failed to update availability") },
      { status: 500 }
    )
  }
}
