import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

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

    const { data, error } = await supabaseServer
      .from("venue_availability")
      .select("is_available")
      .eq("venue_id", venueId)
      .eq("date", date)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      isAvailable: data?.is_available ?? false,
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Failed to check date availability" },
      { status: 500 }
    )
  }
}