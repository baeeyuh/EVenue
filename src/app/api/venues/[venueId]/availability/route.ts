import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET(
  request: Request,
  context: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await context.params
    const { searchParams } = new URL(request.url)

    const year = Number(searchParams.get("year"))
    const month = Number(searchParams.get("month"))

    if (!year || !month) {
      return NextResponse.json(
        { message: "Year and month are required" },
        { status: 400 }
      )
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const endDate = new Date(year, month, 0)
    const endDateString = `${year}-${String(month).padStart(2, "0")}-${String(
      endDate.getDate()
    ).padStart(2, "0")}`

    const { data, error } = await supabaseServer
      .from("venue_availability")
      .select("date, is_available")
      .eq("venue_id", venueId)
      .gte("date", startDate)
      .lte("date", endDateString)

    if (error) {
      console.error("venue availability query error:", error)
      return NextResponse.json(
        { message: error.message, details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      availability: data ?? [],
    })
  } catch (error: any) {
    console.error("availability route error:", error)
    return NextResponse.json(
      { message: error?.message ?? "Failed to load availability" },
      { status: 500 }
    )
  }
}