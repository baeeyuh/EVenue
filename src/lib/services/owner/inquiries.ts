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

function normalizeTime(value: string | null | undefined) {
  if (!value) return null
  const match = /^(\d{2}):(\d{2})(:\d{2})?$/.exec(value)
  if (!match) return null
  return `${match[1]}:${match[2]}`
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

function resolveScheduleWindow(input: {
  eventDate: string
  endDate?: string | null
  startTime?: string | null
  endTime?: string | null
  fallbackStartTime?: string | null
  fallbackEndTime?: string | null
}) {
  const startDate = input.eventDate.slice(0, 10)
  const endDate = (input.endDate || input.eventDate).slice(0, 10)
  const startTime = normalizeTime(input.startTime) ?? normalizeTime(input.fallbackStartTime) ?? "00:00"
  const endTime = normalizeTime(input.endTime) ?? normalizeTime(input.fallbackEndTime) ?? "23:59"
  const resolvedEndDate = startDate === endDate && endTime <= startTime ? addDays(endDate, 1) : endDate

  return {
    startDateTime: `${startDate}T${startTime}:00`,
    endDateTime: `${resolvedEndDate}T${endTime}:00`,
  }
}

async function createBookingForAcceptedInquiry(
  client: SupabaseClient,
  inquiry: InquiryBaseRow,
  ownerId: string,
) {
  if (!inquiry.venue_id) throw new Error("Inquiry is missing venue information")

  const parsed = parseInquiryMessage(inquiry.message)
  const eventDate = inquiry.date ?? parsed.eventDate
  if (!eventDate) throw new Error("Inquiry event date is missing")

  const venueLookup = await client
    .from("venues")
    .select("check_in_time, check_out_time")
    .eq("id", inquiry.venue_id)
    .maybeSingle()
  const venueSchedule = (venueLookup.data as {
    check_in_time?: string | null
    check_out_time?: string | null
  } | null) ?? null
  const window = resolveScheduleWindow({
    eventDate,
    endDate: parsed.endDate,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    fallbackStartTime: venueSchedule?.check_in_time,
    fallbackEndTime: venueSchedule?.check_out_time,
  })

  const existingByInquiry = await client
    .from("bookings")
    .select("id")
    .eq("inquiry_id", inquiry.id)
    .limit(1)

  if (!existingByInquiry.error && (existingByInquiry.data?.length ?? 0) > 0) return

  const conflicts = await client
    .from("bookings")
    .select("id, inquiry_id")
    .eq("venue_id", inquiry.venue_id)
    .in("status", ["pending", "confirmed", "Pending", "Confirmed"])
    .lt("start_date", window.endDateTime)
    .gt("end_date", window.startDateTime)
    .limit(1)

  if (conflicts.error) {
    console.error(conflicts.error)
    throw new Error("Failed to check time availability")
  }

  if ((conflicts.data ?? []).some((booking) => booking.inquiry_id !== inquiry.id)) {
    throw new Error("Selected time is not available")
  }

  const bookingId = crypto.randomUUID()
  const code = `BK-${bookingId.slice(0, 8).toUpperCase()}`
  const clientId = inquiry.client_id ?? inquiry.user_id

  const insert = await client
    .from("bookings")
    .insert({
      id: bookingId,
      inquiry_id: inquiry.id,
      venue_id: inquiry.venue_id,
      user_id: clientId,
      client_id: clientId,
      owner_id: inquiry.owner_id ?? ownerId,
      event_date: eventDate,
      start_date: window.startDateTime,
      end_date: window.endDateTime,
      guest_count: inquiry.pax ?? parsed.guestCount,
      price: parsed.totalPrice,
      status: "confirmed",
      code,
    })
    .select("id")

  if (insert.error) {
    console.error(insert.error)
    throw new Error("Failed to create booking from inquiry")
  }
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
    .select("id, venue_id, user_id, client_id, owner_id, status, message, date, pax")
    .eq("id", inquiryId)
    .maybeSingle()

  if (inquiryLookup.error) {
    console.error(inquiryLookup.error)
    throw new Error("Failed to load inquiry")
  }

  const inquiry = inquiryLookup.data as InquiryBaseRow | null
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

  if (status === "accepted") {
    await createBookingForAcceptedInquiry(client, inquiry, ownerId)
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
