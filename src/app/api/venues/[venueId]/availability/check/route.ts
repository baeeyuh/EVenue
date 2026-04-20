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

export async function GET(
  request: Request,
  context: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await context.params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ message: "Date is required" }, { status: 400 })
    }

    const normalizedDate = normalizeDateKey(date)
    if (!normalizedDate) {
      return NextResponse.json(
        { message: "Invalid date format" },
        { status: 400 }
      )
    }

    const { data: venueData, error: venueError } = await supabaseServer
      .from("venues")
      .select("id, is_available")
      .eq("id", venueId)
      .maybeSingle()

    if (venueError) {
      throw new Error(venueError.message)
    }

    if (!venueData) {
      return NextResponse.json({ message: "Venue not found" }, { status: 404 })
    }

    if (venueData.is_available === false) {
      return NextResponse.json({ isAvailable: false })
    }

    const { data, error } = await supabaseServer
      .from("bookings")
      .select("id")
      .eq("venue_id", venueId)
      .in("status", ["pending", "confirmed", "Pending", "Confirmed"])
      .lte("start_date", `${normalizedDate}T23:59:59`)
      .or(`end_date.gte.${normalizedDate},end_date.is.null`)
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