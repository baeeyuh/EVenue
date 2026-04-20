import { NextResponse } from "next/server"
import { fetchOrganizations } from "@/lib/services/organizations"

export async function GET() {
  try {
    const organizations = await fetchOrganizations()
    return NextResponse.json(organizations)
  } catch {
    return NextResponse.json({ message: "Failed to fetch organizations" }, { status: 500 })
  }
}
