import { NextResponse } from "next/server"
import { getAuthenticatedOwner } from "@/lib/services/owner/auth"
import {
  createOwnerVenue,
  fetchOwnerVenues,
  updateOwnerVenue,
} from "@/lib/services/owner/venues"

function parseCapacity(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue < 0) return null
  return Math.floor(numberValue)
}

function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue < 0) return null
  return numberValue
}

function parseOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function parseAmenities(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseIsAvailable(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    return value.toLowerCase() !== "false"
  }
  return true
}

export async function GET(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const venues = await fetchOwnerVenues(client, userId)
    return NextResponse.json(venues)
  } catch {
    return NextResponse.json({ message: "Failed to fetch venues" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""

    if (!name) {
      return NextResponse.json({ message: "Venue name is required" }, { status: 400 })
    }

    const venue = await createOwnerVenue(client, userId, {
      name,
      location: parseOptionalText(body.location),
      capacity: parseCapacity(body.capacity),
      price: parsePrice(body.price),
      image: parseOptionalText(body.image),
      description: parseOptionalText(body.description),
      amenities: parseAmenities(body.amenities),
      additionalInfo: parseOptionalText(body.additionalInfo),
      venueType: parseOptionalText(body.venueType),
      isAvailable: parseIsAvailable(body.isAvailable),
    })

    return NextResponse.json(venue)
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ message: "Failed to create venue" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, client } = await getAuthenticatedOwner(request)

    if (!userId || !client) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const venueId = typeof body.id === "string" ? body.id.trim() : ""
    const name = typeof body.name === "string" ? body.name.trim() : ""

    if (!venueId) {
      return NextResponse.json({ message: "Venue id is required" }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ message: "Venue name is required" }, { status: 400 })
    }

    const venue = await updateOwnerVenue(client, userId, venueId, {
      name,
      location: parseOptionalText(body.location),
      capacity: parseCapacity(body.capacity),
      price: parsePrice(body.price),
      image: parseOptionalText(body.image),
      description: parseOptionalText(body.description),
      amenities: parseAmenities(body.amenities),
      additionalInfo: parseOptionalText(body.additionalInfo),
      venueType: parseOptionalText(body.venueType),
      isAvailable: parseIsAvailable(body.isAvailable),
    })

    return NextResponse.json(venue)
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ message: "Failed to update venue" }, { status: 500 })
  }
}