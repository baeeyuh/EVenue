import type { SupabaseClient } from "@supabase/supabase-js"
import type { BookingStatus, InquiryStatus, InquiryCreateInput } from "@/types/inquiry-booking"
import {
  appendInquiryThreadMessage,
  composeInquiryMessage,
  isMissingColumnError,
  normalizeInquiryStatus,
  parseInquiryMessage,
} from "@/lib/services/inquiries/shared"

export type ClientInquiryRow = {
  id: string
  status: InquiryStatus
  message: string
  actual_message: string
  created_at: string | null
  venue_id: string
  venue_name: string
  client_id: string
  owner_id: string | null
  date: string
  pax: number | null
}

type InquiryBaseRow = {
  id: string
  status: string | null
  message: string
  created_at: string | null
  venue_id: string | null
  user_id: string | null
  client_id?: string | null
  owner_id?: string | null
  date?: string | null
  pax?: number | null
}

type InquiryMessageLookupRow = {
  id: string
  message: string
  user_id: string | null
}

type BookingRow = {
  id: string
  status: BookingStatus | string | null
  created_at: string | null
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

async function assertVenueWindowAvailable(
  client: SupabaseClient,
  venueId: string,
  window: { startDateTime: string; endDateTime: string },
  ignoreInquiryId?: string,
) {
  const query = client
    .from("bookings")
    .select("id, inquiry_id")
    .eq("venue_id", venueId)
    .in("status", ["pending", "confirmed", "Pending", "Confirmed"])
    .lt("start_date", window.endDateTime)
    .gt("end_date", window.startDateTime)
    .limit(5)

  const { data, error } = await query

  if (error) {
    console.error(error)
    throw new Error("Failed to check time availability")
  }

  const conflicts = ((data ?? []) as Array<{ id: string; inquiry_id?: string | null }>).filter(
    (booking) => !ignoreInquiryId || booking.inquiry_id !== ignoreInquiryId,
  )

  if (conflicts.length > 0) {
    throw new Error("Selected time is not available")
  }
}

async function buildVenueNameMap(
  client: SupabaseClient,
  venueIds: string[]
): Promise<Map<string, string>> {
  if (venueIds.length === 0) {
    return new Map()
  }

  const { data: venuesData, error: venuesError } = await client
    .from("venues")
    .select("id, name")
    .in("id", venueIds)

  if (venuesError) {
    console.error(venuesError)
    return new Map()
  }

  return new Map(
    ((venuesData ?? []) as Array<{ id: string; name: string | null }>).map(
      (venue) => [venue.id, venue.name ?? "Unknown venue"]
    )
  )
}

async function getVenueOwnerId(client: SupabaseClient, venueId: string): Promise<string | null> {
  const venueLookup = await client
    .from("venues")
    .select("organization_id")
    .eq("id", venueId)
    .maybeSingle()

  if (venueLookup.error) {
    console.error(venueLookup.error)
    return null
  }

  const organizationId =
    (venueLookup.data as { organization_id?: string | null } | null)?.organization_id ?? null

  if (!organizationId) {
    return null
  }

  const ownerLookup = await client
    .from("organizations")
    .select("owner_id")
    .eq("id", organizationId)
    .maybeSingle()

  if (ownerLookup.error) {
    console.error(ownerLookup.error)
    return null
  }

  return (ownerLookup.data as { owner_id?: string | null } | null)?.owner_id ?? null
}

function mapInquiryRow(
  inquiry: InquiryBaseRow,
  venueNameMap: Map<string, string>,
  fallbackUserId: string
): ClientInquiryRow {
  const parsed = parseInquiryMessage(inquiry.message)
  const venueId = inquiry.venue_id ?? ""
  const normalizedStatus = normalizeInquiryStatus(inquiry.status)

  return {
    id: inquiry.id,
    status: normalizedStatus,
    message: inquiry.message,
    actual_message: parsed.actualMessage,
    created_at: inquiry.created_at,
    venue_id: venueId,
    venue_name: venueId ? venueNameMap.get(venueId) ?? "Unknown venue" : "Unknown venue",
    client_id: inquiry.client_id ?? inquiry.user_id ?? fallbackUserId,
    owner_id: inquiry.owner_id ?? null,
    date: inquiry.date ?? parsed.eventDate,
    pax: inquiry.pax ?? parsed.guestCount,
  }
}

export async function createInquiry(
  client: SupabaseClient,
  userId: string,
  payload: InquiryCreateInput
): Promise<{ id: string }> {
  const inquiryId = crypto.randomUUID()
  const ownerId = await getVenueOwnerId(client, payload.venueId)
  const venueLookup = await client
    .from("venues")
    .select("check_in_time, check_out_time")
    .eq("id", payload.venueId)
    .maybeSingle()
  const venueSchedule = (venueLookup.data as {
    check_in_time?: string | null
    check_out_time?: string | null
  } | null) ?? null
  const scheduleWindow = resolveScheduleWindow({
    eventDate: payload.eventDate,
    endDate: payload.endDate,
    startTime: payload.startTime,
    endTime: payload.endTime,
    fallbackStartTime: venueSchedule?.check_in_time,
    fallbackEndTime: venueSchedule?.check_out_time,
  })

  await assertVenueWindowAvailable(client, payload.venueId, scheduleWindow)

  const rawMessage = composeInquiryMessage({
    venueLabel: payload.venueId,
    eventDate: payload.eventDate,
    endDate: payload.endDate,
    message: payload.message.trim(),
    eventType: payload.eventType,
    guestCount: payload.guestCount,
    startTime: payload.startTime,
    endTime: payload.endTime,
    contactNumber: payload.contactNumber,
    email: payload.email,
    fullName: payload.fullName,
    bookingType: payload.bookingType,
    durationHours: payload.durationHours,
    priceBreakdown: payload.priceBreakdown,
    totalPrice: payload.totalPrice,
  })
  const fallbackStructuredMessage = [
    `Event date: ${payload.eventDate}`,
    payload.endDate ? `End date: ${payload.endDate}` : null,
    typeof payload.guestCount === "number" ? `Guest count: ${payload.guestCount}` : null,
    "",
    "Message:",
    rawMessage,
  ]
    .filter(Boolean)
    .join("\n")

  const richInsert = await client.from("inquiries").insert({
    id: inquiryId,
    venue_id: payload.venueId,
    user_id: userId,
    client_id: userId,
    owner_id: ownerId,
    date: payload.eventDate,
    pax: payload.guestCount ?? null,
    message: rawMessage,
    status: "pending",
  }).select("id")

  if (!richInsert.error) {
    const insertedId = (richInsert.data as Array<{ id: string }> | null)?.[0]?.id
    return { id: insertedId ?? inquiryId }
  }

  const missingStructuredCols =
    isMissingColumnError(richInsert.error, "client_id") ||
    isMissingColumnError(richInsert.error, "owner_id") ||
    isMissingColumnError(richInsert.error, "date") ||
    isMissingColumnError(richInsert.error, "pax")

  if (!missingStructuredCols) {
    console.error(richInsert.error)
    throw new Error(richInsert.error.message || "Failed to create inquiry")
  }

  const fallbackInsert = await client.from("inquiries").insert({
    id: inquiryId,
    venue_id: payload.venueId,
    user_id: userId,
    message: fallbackStructuredMessage,
    status: "pending",
  }).select("id")

  if (fallbackInsert.error) {
    console.error(fallbackInsert.error)
    throw new Error(fallbackInsert.error.message || "Failed to create inquiry")
  }

  const fallbackId = (fallbackInsert.data as Array<{ id: string }> | null)?.[0]?.id

  return { id: fallbackId ?? inquiryId }
}

export async function getClientInquiries(
  client: SupabaseClient,
  userId: string
): Promise<ClientInquiryRow[]> {
  const preferredSelect = "id, status, message, created_at, venue_id, user_id, client_id, owner_id, date, pax"
  const fallbackSelect = "id, status, message, created_at, venue_id, user_id"

  const preferredQuery = await client
    .from("inquiries")
    .select(preferredSelect)
    .eq("user_id", userId)
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
      .select(fallbackSelect)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

  inquiriesData = fallbackQuery.data as InquiryBaseRow[] | null
    inquiriesError = fallbackQuery.error
  }

  if (inquiriesError) {
    console.error(inquiriesError)
    throw new Error("Failed to fetch client inquiries")
  }

  const inquiries = (inquiriesData ?? []) as InquiryBaseRow[]

  const venueIds = Array.from(
    new Set(inquiries.map((inquiry) => inquiry.venue_id).filter(Boolean))
  ) as string[]

  const venueNameMap = await buildVenueNameMap(client, venueIds)

  return inquiries.map((inquiry) => mapInquiryRow(inquiry, venueNameMap, userId))
}

export async function fetchClientInquiries(
  client: SupabaseClient,
  userId: string
): Promise<ClientInquiryRow[]> {
  return getClientInquiries(client, userId)
}

export async function fetchClientInquiryById(
  client: SupabaseClient,
  userId: string,
  inquiryId: string
): Promise<ClientInquiryRow | null> {
  const inquiries = await getClientInquiries(client, userId)
  return inquiries.find((inquiry) => inquiry.id === inquiryId) ?? null
}

export async function confirmBooking(
  client: SupabaseClient,
  userId: string,
  inquiryId: string
): Promise<{ booking: BookingRow; created: boolean }> {
  const preferredLookup = await client
    .from("inquiries")
    .select("id, venue_id, user_id, client_id, owner_id, status, message, date, pax")
    .eq("id", inquiryId)
    .eq("user_id", userId)
    .maybeSingle()

  let inquiryData = preferredLookup.data as InquiryBaseRow | null
  let inquiryError = preferredLookup.error

  if (
    inquiryError &&
    (isMissingColumnError(inquiryError, "client_id") ||
      isMissingColumnError(inquiryError, "owner_id") ||
      isMissingColumnError(inquiryError, "date") ||
      isMissingColumnError(inquiryError, "pax"))
  ) {
    const fallbackLookup = await client
      .from("inquiries")
      .select("id, venue_id, user_id, status, message")
      .eq("id", inquiryId)
      .eq("user_id", userId)
      .maybeSingle()

    inquiryData = fallbackLookup.data as InquiryBaseRow | null
    inquiryError = fallbackLookup.error
  }

  if (inquiryError) {
    console.error(inquiryError)
    throw new Error("Failed to load inquiry for confirmation")
  }

  if (!inquiryData) {
    throw new Error("Inquiry not found")
  }

  if (normalizeInquiryStatus(inquiryData.status) !== "accepted") {
    throw new Error("Only accepted inquiries can be confirmed")
  }

  const parsed = parseInquiryMessage(inquiryData.message)
  const bookingDate = inquiryData.date ?? parsed.eventDate
  const bookingEndDate = parsed.endDate || null

  if (!bookingDate) {
    throw new Error("Inquiry event date is missing")
  }

  if (!inquiryData.venue_id) {
    throw new Error("Inquiry venue is missing")
  }

  if (bookingEndDate && bookingEndDate < bookingDate) {
    throw new Error("Inquiry end date is before the start date")
  }

  const venueLookup = await client
    .from("venues")
    .select("check_in_time, check_out_time")
    .eq("id", inquiryData.venue_id)
    .maybeSingle()
  const venueSchedule = (venueLookup.data as {
    check_in_time?: string | null
    check_out_time?: string | null
  } | null) ?? null
  const scheduleWindow = resolveScheduleWindow({
    eventDate: bookingDate,
    endDate: bookingEndDate,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    fallbackStartTime: venueSchedule?.check_in_time,
    fallbackEndTime: venueSchedule?.check_out_time,
  })

  const existingByInquiry = await client
    .from("bookings")
    .select("id, status, created_at")
    .eq("inquiry_id", inquiryId)
    .limit(1)
    .maybeSingle()

  if (!existingByInquiry.error && existingByInquiry.data) {
    return {
      booking: existingByInquiry.data as BookingRow,
      created: false,
    }
  }

  await assertVenueWindowAvailable(client, inquiryData.venue_id, scheduleWindow, inquiryId)

  const bookingId = crypto.randomUUID()
  const code = `BK-${bookingId.slice(0, 8).toUpperCase()}`

  const richInsert = await client
    .from("bookings")
    .insert({
      id: bookingId,
      inquiry_id: inquiryId,
      venue_id: inquiryData.venue_id,
      user_id: userId,
      client_id: inquiryData.client_id ?? inquiryData.user_id ?? userId,
      owner_id: inquiryData.owner_id ?? null,
      event_date: bookingDate,
      start_date: scheduleWindow.startDateTime,
      end_date: scheduleWindow.endDateTime,
      guest_count: inquiryData.pax ?? parsed.guestCount,
      price: parsed.totalPrice,
      status: "confirmed",
      code,
    })
    .select("id, status, created_at")
    .single()

  if (!richInsert.error && richInsert.data) {
    return {
      booking: richInsert.data as BookingRow,
      created: true,
    }
  }

  const fallbackInsert = await client
    .from("bookings")
    .insert({
      id: bookingId,
      venue_id: inquiryData.venue_id,
      user_id: userId,
      start_date: scheduleWindow.startDateTime,
      end_date: scheduleWindow.endDateTime,
      status: "confirmed",
      code,
    })
    .select("id, status, created_at")
    .single()

  if (!fallbackInsert.error && fallbackInsert.data) {
    return {
      booking: fallbackInsert.data as BookingRow,
      created: true,
    }
  }

  const noCodeFallbackInsert = await client
    .from("bookings")
    .insert({
      id: bookingId,
      venue_id: inquiryData.venue_id,
      user_id: userId,
      start_date: scheduleWindow.startDateTime,
      end_date: scheduleWindow.endDateTime,
      status: "confirmed",
    })
    .select("id, status, created_at")
    .single()

  if (noCodeFallbackInsert.error || !noCodeFallbackInsert.data) {
    console.error(noCodeFallbackInsert.error ?? fallbackInsert.error ?? richInsert.error)
    throw new Error("Failed to confirm booking")
  }

  return {
    booking: noCodeFallbackInsert.data as BookingRow,
    created: true,
  }
}

export async function sendClientInquiryMessage(
  client: SupabaseClient,
  userId: string,
  inquiryId: string,
  message: string
): Promise<{ id: string; message: string }> {
  const nextMessage = message.trim()

  if (!nextMessage) {
    throw new Error("Message is required")
  }

  const lookup = await client
    .from("inquiries")
    .select("id, message, user_id")
    .eq("id", inquiryId)
    .eq("user_id", userId)
    .maybeSingle()

  const inquiry = lookup.data as InquiryMessageLookupRow | null

  if (lookup.error) {
    console.error(lookup.error)
    throw new Error("Failed to load inquiry")
  }

  if (!inquiry) {
    throw new Error("Inquiry not found")
  }

  const nextThread = appendInquiryThreadMessage(inquiry.message, {
    role: "client",
    message: nextMessage,
  })

  const updateResult = await client
    .from("inquiries")
    .update({ message: nextThread })
    .eq("id", inquiryId)
    .eq("user_id", userId)
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
