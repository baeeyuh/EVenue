import { NextResponse } from "next/server"
import { fetchVenues } from "@/lib/services/venues"

export async function GET() {
  try {
    const venues = await fetchVenues()
    return NextResponse.json(venues)
  } catch {
    return NextResponse.json({ message: "Failed to fetch venues" }, { status: 500 })
  }
}
