import type { SupabaseClient } from "@supabase/supabase-js"
import { getOwnerOrgIds } from "@/lib/services/owner/organizations"
import type { InquiryStatus } from "@/types/inquiry-booking"
import {
  appendInquiryThreadMessage,
  isMissingColumnError,
  normalizeInquiryStatus,
  parseInquiryMessage,
} from "@/lib/services/inquiries/shared"

export type OwnerInquiryRow = {
  id: string
  message: string
  actual_message: string
  status: InquiryStatus
  created_at: string | null
  venue_id: string
  venue_name: string
  user_id: string
  client_id: string
  owner_id: string | null
  date: string
  pax: number | null
  client_name: string | null
  client_email: string | null
}

export type OwnerInquiryStatusUpdateResult = {
  id: string
  status: InquiryStatus
}

type InquiryBaseRow = {
  id: string
  message: string
  status: string | null
  created_at: string | null
  venue_id: string | null
  user_id: string | null
  client_id?: string | null
  owner_id?: string | null
  date?: string | null
  pax?: number | null
}

async function buildClientProfileMap(client: SupabaseClient, userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, { name: string | null; email: string | null }>()
  }

  const { data, error } = await client
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", userIds)

  if (error) {
    console.error(error)
    return new Map<string, { name: string | null; email: string | null }>()
  }

  const entries = ((data ?? []) as Array<{
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  }>).map((profile) => {
    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()

    return [
      profile.id,
      {
        name: fullName || null,
        email: profile.email,
      },
    ] as const
  })

  return new Map(entries)
}

export async function getOwnerInquiries(
  client: SupabaseClient,
  ownerId: string
): Promise<OwnerInquiryRow[]> {
  const orgIds = await getOwnerOrgIds(client, ownerId)

  if (orgIds.length === 0) return []

  const { data: venuesData, error: venuesError } = await client
    .from("venues")
    .select("id, name")
    .in("organization_id", orgIds)

  if (venuesError) {
    console.error(venuesError)
    throw new Error("Failed to fetch owner venues for inquiries")
  }

  const venues = (venuesData ?? []) as Array<{ id: string; name: string | null }>
  const venueIds = venues.map((venue) => venue.id)
  const venueNameMap = new Map(venues.map((venue) => [venue.id, venue.name ?? "Unknown venue"]))

  if (venueIds.length === 0) return []

  const preferredQuery = await client
    .from("inquiries")
    .select("id, message, status, created_at, venue_id, user_id, client_id, owner_id, date, pax")
    .in("venue_id", venueIds)
    .order("created_at", { ascending: false })

  let inquiriesData = preferredQuery.data as InquiryBaseRow[] | null
  let inquiriesError = preferredQuery.error

  if (
    inquiriesError &&
    (isMissingColumnError(inquiriesError, "client_id") ||
      isMissingColumnError(inquiriesError, "owner_id") ||
      isMissingColumnError(inquiriesError, "date") ||
      isMissingColumnError(inquiriesError, "pax"))
  ) {
    const fallbackQuery = await client
      .from("inquiries")
      .select("id, message, status, created_at, venue_id, user_id")
      .in("venue_id", venueIds)
      .order("created_at", { ascending: false })

    inquiriesData = fallbackQuery.data as InquiryBaseRow[] | null
    inquiriesError = fallbackQuery.error
  }

  if (inquiriesError) {
    console.error(inquiriesError)
    throw new Error("Failed to fetch owner inquiries")
  }

  const inquiries = inquiriesData ?? []
  const userIds = Array.from(
    new Set(inquiries.map((inquiry) => inquiry.client_id ?? inquiry.user_id).filter(Boolean))
  ) as string[]
  const profileMap = await buildClientProfileMap(client, userIds)

  return inquiries.map((inquiry) => {
    const parsed = parseInquiryMessage(inquiry.message)
    const clientId = inquiry.client_id ?? inquiry.user_id ?? ""
    const profile = profileMap.get(clientId)

    return {
      id: inquiry.id,
      message: inquiry.message,
      actual_message: parsed.actualMessage,
      status: normalizeInquiryStatus(inquiry.status),
      created_at: inquiry.created_at,
      venue_id: inquiry.venue_id ?? "",
      venue_name: inquiry.venue_id
        ? venueNameMap.get(inquiry.venue_id) ?? "Unknown venue"
        : "Unknown venue",
      user_id: inquiry.user_id ?? "",
      client_id: clientId,
      owner_id: inquiry.owner_id ?? ownerId,
      date: inquiry.date ?? parsed.eventDate,
      pax: inquiry.pax ?? parsed.guestCount,
      client_name: profile?.name ?? (parsed.fullName || null),
      client_email: profile?.email ?? (parsed.email || null),
    }
  })
}

export async function fetchOwnerInquiries(
  client: SupabaseClient,
  ownerId: string
): Promise<OwnerInquiryRow[]> {
  return getOwnerInquiries(client, ownerId)
}

export async function updateInquiryStatus(
  client: SupabaseClient,
  ownerId: string,
  inquiryId: string,
  status: InquiryStatus
): Promise<OwnerInquiryStatusUpdateResult> {
  const orgIds = await getOwnerOrgIds(client, ownerId)
  if (orgIds.length === 0) {
    throw new Error("No organizations found for this owner")
  }

  const inquiryLookup = await client
    .from("inquiries")
    .select("id, venue_id, status")
    .eq("id", inquiryId)
    .maybeSingle()

  if (inquiryLookup.error) {
    console.error(inquiryLookup.error)
    throw new Error("Failed to load inquiry")
  }

  const inquiry = inquiryLookup.data as { id: string; venue_id: string | null } | null
  if (!inquiry) {
    throw new Error("Inquiry not found")
  }

  if (!inquiry.venue_id) {
    throw new Error("Inquiry is missing venue information")
  }

  const venueLookup = await client
    .from("venues")
    .select("id, organization_id")
    .eq("id", inquiry.venue_id)
    .maybeSingle()

  if (venueLookup.error) {
    console.error(venueLookup.error)
    throw new Error("Failed to load inquiry venue")
  }

  const venue = venueLookup.data as { id: string; organization_id: string | null } | null
  if (!venue?.organization_id || !orgIds.includes(venue.organization_id)) {
    throw new Error("Inquiry does not belong to this owner")
  }

  let updateResult = await client
    .from("inquiries")
    .update({ status })
    .eq("id", inquiryId)
    .eq("venue_id", inquiry.venue_id)
    .select("id, status")

  if (updateResult.error && isMissingColumnError(updateResult.error, "status")) {
    updateResult = await client
      .from("inquiries")
      .update({ status })
      .eq("id", inquiryId)
      .eq("venue_id", inquiry.venue_id)
      .select("id, status")
  }

  if (updateResult.error) {
    console.error(updateResult.error)
    throw new Error(updateResult.error.message || "Failed to update inquiry status")
  }

  const updatedRow = (updateResult.data as Array<{ id: string; status: string | null }> | null)?.[0]

  if (!updatedRow) {
    throw new Error("Inquiry status update did not match any records")
  }

  return {
    id: updatedRow.id,
    status: normalizeInquiryStatus(updatedRow.status),
  }
}

export async function sendOwnerInquiryMessage(
  client: SupabaseClient,
  ownerId: string,
  inquiryId: string,
  message: string
): Promise<{ id: string; message: string }> {
  const nextMessage = message.trim()

  if (!nextMessage) {
    throw new Error("Message is required")
  }

  const inquiries = await getOwnerInquiries(client, ownerId)
  const existing = inquiries.find((inquiry) => inquiry.id === inquiryId)

  if (!existing) {
    throw new Error("Inquiry not found")
  }

  const updateResult = await client
    .from("inquiries")
    .update({
      message: appendInquiryThreadMessage(existing.message, {
        role: "owner",
        message: nextMessage,
      }),
    })
    .eq("id", inquiryId)
    .select("id")

  if (updateResult.error) {
    console.error(updateResult.error)
    throw new Error("Failed to send message")
  }

  return {
    id: inquiryId,
    message: nextMessage,
  }
}
