import type { SupabaseClient } from "@supabase/supabase-js"

import { getOwnerOrgIds } from "@/lib/services/owner/organizations"
import { getInquiryThread, isMissingColumnError, parseInquiryMessage } from "@/lib/services/inquiries/shared"
import type {
  BookingDetails,
  DetailMessage,
  DetailPerson,
  DetailVenue,
  InquiryDetails,
} from "@/lib/services/details/types"

type InquiryBaseRow = {
  id: string
  status: string | null
  created_at: string | null
  date?: string | null
  pax?: number | null
  message: string
  venue_id: string | null
  user_id: string | null
  client_id?: string | null
  owner_id?: string | null
}

type BookingBaseRow = {
  id: string
  code: string | null
  status: string | null
  created_at: string | null
  inquiry_id?: string | null
  venue_id: string | null
  user_id?: string | null
  client_id?: string | null
  owner_id?: string | null
  event_date?: string | null
  start_date?: string | null
  end_date?: string | null
  guest_count?: number | null
  price?: number | null
}

type RelationalInquiryRow = {
  id: string
  status: string | null
  created_at: string | null
  date: string | null
  pax: number | null
  message: string
  venue_id: string | null
  user_id: string | null
  client_id: string | null
  owner_id: string | null
  venue:
    | {
        id: string
        name: string | null
        location: string | null
        price: number | null
      }
    | {
        id: string
        name: string | null
        location: string | null
        price: number | null
      }[]
    | null
  client:
    | {
        id: string
        first_name: string | null
        last_name: string | null
        email: string | null
      }
    | {
        id: string
        first_name: string | null
        last_name: string | null
        email: string | null
      }[]
    | null
  owner:
    | {
        id: string
        first_name: string | null
        last_name: string | null
        email: string | null
      }
    | {
        id: string
        first_name: string | null
        last_name: string | null
        email: string | null
      }[]
    | null
  messages: Array<{
    id: string
    message: string | null
    sender_role: string | null
    created_at: string | null
  }> | null
}

type OwnerInquiryDetailsViewRow = {
  id: string
  status: string | null
  date: string | null
  created_at: string | null
  pax: number | null
  venue: {
    id: string | null
    name: string
    location: string | null
    image: string | null
    rating: number | null
    review_count: number | null
    venue_type: string | null
    capacity: number | null
    price: number | null
    is_available: boolean | null
    amenities: string[] | null
    description: string | null
    additional_info: string | null
  } | null
  client: {
    id: string | null
    name: string
    email: string | null
  } | null
  owner: {
    name: string
    email: string | null
  } | null
  messages: Array<{
    id: string
    message: string
    sender_role: string
    created_at: string
  }> | null
}

type OwnerBookingDetailsViewRow = {
  id: string
  code: string | null
  status: string | null
  created_at: string | null
  event_date: string | null
  end_date: string | null
  venue: {
    id: string | null
    name: string
    location: string | null
    image: string | null
    rating: number | null
    review_count: number | null
    venue_type: string | null
    capacity: number | null
    price: number | null
    is_available: boolean | null
    amenities: string[] | null
    description: string | null
    additional_info: string | null
  } | null
  client: {
    id: string | null
    name: string
    email: string | null
  } | null
  owner: {
    name: string
    email: string | null
  } | null
  inquiry: {
    pax: number | null
    messages: Array<{
      id: string
      message: string
      sender_role: string
      created_at: string
    }> | null
  } | null
}

type ClientInquiryDetailsViewRow = {
  id: string
  status: string | null
  date: string | null
  created_at: string | null
  pax: number | null
  venue: {
    id: string | null
    name: string
    location: string | null
    image: string | null
    rating: number | null
    review_count: number | null
    venue_type: string | null
    capacity: number | null
    price: number | null
    is_available: boolean | null
    amenities: string[] | null
    description: string | null
    additional_info: string | null
  } | null
  client: {
    id: string | null
    name: string
    email: string | null
  } | null
  owner: {
    name: string
    email: string | null
  } | null
  messages: Array<{
    id: string
    message: string
    sender_role: string
    created_at: string
  }> | null
}

type ClientBookingDetailsViewRow = {
  id: string
  code: string | null
  status: string | null
  created_at: string | null
  event_date: string | null
  end_date: string | null
  venue: {
    id: string | null
    name: string
    location: string | null
    image: string | null
    rating: number | null
    review_count: number | null
    venue_type: string | null
    capacity: number | null
    price: number | null
    is_available: boolean | null
    amenities: string[] | null
    description: string | null
    additional_info: string | null
  } | null
  client: {
    id: string | null
    name: string
    email: string | null
  } | null
  owner: {
    name: string
    email: string | null
  } | null
  inquiry: {
    pax: number | null
    messages: Array<{
      id: string
      message: string
      sender_role: string
      created_at: string
    }> | null
  } | null
}

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

async function tryGetRelationalInquiryDetails(client: SupabaseClient, inquiryId: string) {
  const relationalQuery = await client
    .from("inquiries")
    .select(
      `id, status, created_at, date, pax, message, venue_id, user_id, client_id, owner_id,
      venue:venues!inquiries_venue_id_fkey(id, name, location, price),
      client:profiles!inquiries_client_id_fkey(id, first_name, last_name, email),
      owner:profiles!inquiries_owner_id_fkey(id, first_name, last_name, email),
      messages:inquiry_messages(id, message, sender_role, created_at)`
    )
    .eq("id", inquiryId)
    .maybeSingle()

  if (relationalQuery.error || !relationalQuery.data) {
    return null
  }

  const row = relationalQuery.data as unknown as RelationalInquiryRow
  const venue = pickOne(row.venue)
  const clientProfile = pickOne(row.client)
  const ownerProfile = pickOne(row.owner)
  const clientId = row.client_id ?? row.user_id ?? null
  const ownerId = row.owner_id ?? null

  const [fullVenue, fallbackClientProfile, fallbackOwnerProfile] = await Promise.all([
    fetchVenue(client, venue?.id ?? row.venue_id ?? null),
    !clientProfile && clientId ? fetchProfile(client, clientId) : Promise.resolve(null),
    !ownerProfile && ownerId ? fetchProfile(client, ownerId) : Promise.resolve(null),
  ])

  const fallbackMessages = getInquiryThread(row.message, row.created_at).map((message) => ({
    id: message.id,
    message: message.message,
    sender_role: message.role,
    created_at: message.createdAt,
  }))

  const messages =
    row.messages && row.messages.length > 0
      ? row.messages.map((item) => ({
          id: item.id,
          message: item.message ?? "",
          sender_role: (item.sender_role === "owner" ? "owner" : "client") as "owner" | "client",
          created_at: item.created_at ?? new Date(0).toISOString(),
        }))
      : fallbackMessages

  return {
    access: {
      user_id: row.user_id,
      client_id: row.client_id,
      venue_id: row.venue_id,
    },
    details: {
      id: row.id,
      date: row.date,
      pax: row.pax,
      status: row.status,
      created_at: row.created_at,
      venue: fullVenue,
      client: {
        id: fallbackClientProfile?.id ?? clientProfile?.id ?? clientId,
        name: fallbackClientProfile?.name ?? buildName(clientProfile),
        email: fallbackClientProfile?.email ?? clientProfile?.email ?? null,
      },
      owner: {
        id: fallbackOwnerProfile?.id ?? ownerProfile?.id ?? ownerId,
        name: fallbackOwnerProfile?.name ?? buildName(ownerProfile),
        email: fallbackOwnerProfile?.email ?? ownerProfile?.email ?? null,
      },
      messages: messages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
      ...inquiryScheduleFields(row.message),
    } as InquiryDetails,
  }
}

function buildName(profile: {
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  display_name?: string | null
} | null) {
  if (!profile) return "Unknown"

  if (profile.full_name?.trim()) return profile.full_name
  if (profile.display_name?.trim()) return profile.display_name

  const composed = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
  return composed || "Unknown"
}

function inquiryScheduleFields(message: string) {
  const parsed = parseInquiryMessage(message)

  return {
    start_time: parsed.startTime || null,
    end_time: parsed.endTime || null,
    booking_type: parsed.bookingType || null,
    duration_hours: parsed.durationHours,
    price_breakdown: parsed.priceBreakdown || null,
    total_price: parsed.totalPrice,
  }
}

async function fetchProfile(client: SupabaseClient, id: string | null): Promise<DetailPerson> {
  if (!id) {
    return {
      id: null,
      name: "Unknown",
      email: null,
    }
  }

  const profileLookup = await client
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("id", id)
    .maybeSingle()

  const profile = (profileLookup.data as {
    id: string
    first_name?: string | null
    last_name?: string | null
    email?: string | null
  } | null) ?? null

  return {
    id,
    name: buildName(profile),
    email: profile?.email ?? null,
  }
}

async function fetchVenue(client: SupabaseClient, venueId: string | null): Promise<DetailVenue> {
  if (!venueId) {
    return {
      id: null,
      name: "Unknown venue",
      location: null,
      price: null,
    }
  }

  const preferredLookup = await client
    .from("venues")
    .select("id, name, location, price, capacity, venue_type, description, additional_info, image, is_available, amenities, rating, review_count")
    .eq("id", venueId)
    .maybeSingle()

  let venueData = preferredLookup.data as {
    id: string
    name?: string | null
    location?: string | null
    price?: number | null
    capacity?: number | null
    venue_type?: string | null
    description?: string | null
    additional_info?: string | null
    image?: string | null
    is_available?: boolean | null
    amenities?: string[] | null
    rating?: number | null
    review_count?: number | null
  } | null
  let venueError = preferredLookup.error

  if (
    venueError &&
    (isMissingColumnError(venueError, "capacity") ||
      isMissingColumnError(venueError, "venue_type") ||
      isMissingColumnError(venueError, "additional_info") ||
  isMissingColumnError(venueError, "is_available") ||
  isMissingColumnError(venueError, "amenities") ||
  isMissingColumnError(venueError, "rating") ||
  isMissingColumnError(venueError, "review_count"))
  ) {
    const fallbackLookup = await client
      .from("venues")
      .select("id, name, location, price")
      .eq("id", venueId)
      .maybeSingle()

    venueData = fallbackLookup.data as {
      id: string
      name?: string | null
      location?: string | null
      price?: number | null
    } | null
    venueError = fallbackLookup.error
  }

  if (venueError) {
    return {
      id: venueId,
      name: "Unknown venue",
      location: null,
      price: null,
    }
  }

  const venue = venueData ?? null

  return {
    id: venueId,
    name: venue?.name ?? "Unknown venue",
    location: venue?.location ?? null,
    price: typeof venue?.price === "number" ? venue.price : null,
    capacity: typeof venue?.capacity === "number" ? venue.capacity : null,
    venue_type: venue?.venue_type ?? null,
    description: venue?.description ?? null,
    additional_info: venue?.additional_info ?? null,
    image: venue?.image ?? null,
    is_available: typeof venue?.is_available === "boolean" ? venue.is_available : null,
    amenities: Array.isArray(venue?.amenities) ? venue.amenities : null,
    rating: typeof venue?.rating === "number" ? venue.rating : null,
    review_count: typeof venue?.review_count === "number" ? venue.review_count : null,
  }
}

async function fetchInquiryMessagesByInquiryId(
  client: SupabaseClient,
  inquiryId: string,
  fallbackMessage?: string,
  fallbackCreatedAt?: string | null,
): Promise<DetailMessage[]> {
  const inquiryLookup = await client
    .from("inquiries")
    .select("id, message, created_at")
    .eq("id", inquiryId)
    .maybeSingle()

  if (inquiryLookup.error && !fallbackMessage) {
    return []
  }

  const sourceMessage =
    (inquiryLookup.data as { message?: string | null } | null)?.message ?? fallbackMessage ?? ""
  const sourceCreatedAt =
    (inquiryLookup.data as { created_at?: string | null } | null)?.created_at ?? fallbackCreatedAt

  if (!sourceMessage.trim()) {
    return []
  }

  return getInquiryThread(sourceMessage, sourceCreatedAt)
    .map((message) => ({
      id: message.id,
      message: message.message,
      sender_role: message.role,
      created_at: message.createdAt,
    }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

async function fetchMessagesForBooking(client: SupabaseClient, bookingId: string): Promise<DetailMessage[]> {
  const inquiry = await resolveInquiryForBooking(client, bookingId)

  if (!inquiry) {
    return []
  }

  return fetchMessages(client, inquiry)
}

async function resolveInquiryForBooking(
  client: SupabaseClient,
  bookingId: string
): Promise<InquiryBaseRow | null> {
  const booking = await fetchBookingBase(client, bookingId)

  if (!booking) {
    return null
  }

  if (booking.inquiry_id) {
    return fetchInquiryBase(client, booking.inquiry_id)
  }

  const bookingUserId = booking.client_id ?? booking.user_id ?? null

  if (!bookingUserId || !booking.venue_id) {
    return null
  }

  const preferredLookup = await client
    .from("inquiries")
    .select("id, status, created_at, date, pax, message, venue_id, user_id, client_id, owner_id")
    .eq("venue_id", booking.venue_id)
    .eq("user_id", bookingUserId)
    .order("created_at", { ascending: false })
    .limit(30)

  let inquiryRows = (preferredLookup.data as InquiryBaseRow[] | null) ?? []
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
      .select("id, status, created_at, message, venue_id, user_id")
      .eq("venue_id", booking.venue_id)
      .eq("user_id", bookingUserId)
      .order("created_at", { ascending: false })
      .limit(30)

    inquiryRows = (fallbackLookup.data as InquiryBaseRow[] | null) ?? []
    inquiryError = fallbackLookup.error
  }

  if (inquiryError || inquiryRows.length === 0) {
    return null
  }

  const bookingDateValue = booking.event_date ?? booking.start_date ?? null
  const bookingDate = bookingDateValue ? bookingDateValue.slice(0, 10) : null

  if (!bookingDate) {
    return inquiryRows[0] ?? null
  }

  const matchedByDate = inquiryRows.find((item) => {
    const parsed = parseInquiryMessage(item.message)
    const inquiryDate = item.date ?? parsed.eventDate
    return inquiryDate?.slice(0, 10) === bookingDate
  })

  return matchedByDate ?? inquiryRows[0] ?? null
}

function parseViewMessages(value: unknown): DetailMessage[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const candidate = item as {
        id?: unknown
        message?: unknown
        sender_role?: unknown
        created_at?: unknown
      }

      const senderRole = candidate.sender_role === "owner" ? "owner" : "client"
      const rawMessage = typeof candidate.message === "string" ? candidate.message : ""
      const normalizedMessage = rawMessage.includes("Message:")
        ? parseInquiryMessage(rawMessage).actualMessage
        : rawMessage

      return {
        id:
          typeof candidate.id === "string" && candidate.id.trim().length > 0
            ? candidate.id
            : `msg-${index}`,
        message: normalizedMessage,
        sender_role: senderRole,
        created_at:
          typeof candidate.created_at === "string" && candidate.created_at.trim().length > 0
            ? candidate.created_at
            : new Date(0).toISOString(),
      } satisfies DetailMessage
    })
    .filter((item): item is DetailMessage => Boolean(item))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== "object") return false

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string }
  const haystack = [candidate.message, candidate.details, candidate.hint]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase()

  return candidate.code === "42P01" || haystack.includes("does not exist")
}

async function fetchMessages(client: SupabaseClient, inquiry: InquiryBaseRow): Promise<DetailMessage[]> {
  return fetchInquiryMessagesByInquiryId(client, inquiry.id, inquiry.message, inquiry.created_at)
}

async function fetchInquiryBase(client: SupabaseClient, inquiryId: string): Promise<InquiryBaseRow | null> {
  const preferredLookup = await client
    .from("inquiries")
    .select("id, status, created_at, date, pax, message, venue_id, user_id, client_id, owner_id")
    .eq("id", inquiryId)
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
      .select("id, status, created_at, message, venue_id, user_id")
      .eq("id", inquiryId)
      .maybeSingle()

    inquiryData = fallbackLookup.data as InquiryBaseRow | null
    inquiryError = fallbackLookup.error
  }

  if (inquiryError) {
    throw new Error("Failed to fetch inquiry details")
  }

  return inquiryData
}

async function buildInquiryDetails(
  client: SupabaseClient,
  inquiry: InquiryBaseRow
): Promise<InquiryDetails> {
  const clientId = inquiry.client_id ?? inquiry.user_id ?? null
  const ownerId = inquiry.owner_id ?? null

  const [venue, clientProfile, ownerProfile, messages] = await Promise.all([
    fetchVenue(client, inquiry.venue_id),
    fetchProfile(client, clientId),
    fetchProfile(client, ownerId),
    fetchMessages(client, inquiry),
  ])

  return {
    id: inquiry.id,
    date: inquiry.date ?? null,
    pax: inquiry.pax ?? null,
    status: inquiry.status,
    created_at: inquiry.created_at,
    venue,
    client: clientProfile,
    owner: ownerProfile,
    messages,
    ...inquiryScheduleFields(inquiry.message),
  }
}

export async function getClientInquiryDetails(
  client: SupabaseClient,
  userId: string,
  inquiryId: string
): Promise<InquiryDetails | null> {
  const viewLookup = await client
    .from("client_inquiry_details_view")
    .select("*")
    .eq("id", inquiryId)
    .maybeSingle()

  if (!viewLookup.error && viewLookup.data) {
    const row = viewLookup.data as ClientInquiryDetailsViewRow

    const viewMessages = parseViewMessages(row.messages)
    const threadMessages = await fetchInquiryMessagesByInquiryId(client, row.id, undefined, row.created_at)
    const messages = threadMessages.length > 0 ? threadMessages : viewMessages
    const rawInquiry = await fetchInquiryBase(client, row.id)

    const venue: DetailVenue = row.venue
      ? {
          id: row.venue.id,
          name: row.venue.name,
          location: row.venue.location,
          price: row.venue.price,
          capacity: row.venue.capacity,
          venue_type: row.venue.venue_type,
          description: row.venue.description,
          additional_info: row.venue.additional_info,
          image: row.venue.image,
          is_available: row.venue.is_available,
          amenities: row.venue.amenities,
          rating: row.venue.rating,
          review_count: row.venue.review_count,
        }
      : {
          id: null,
          name: "Unknown venue",
          location: null,
          price: null,
        }

    return {
      id: row.id,
      date: row.date,
      pax: row.pax,
      status: row.status,
      created_at: row.created_at,
      venue,
      client: row.client ? { id: row.client.id, name: row.client.name, email: row.client.email } : { id: null, name: "Unknown", email: null },
      owner: row.owner ? { id: null, name: row.owner.name, email: row.owner.email } : { id: null, name: "Unknown", email: null },
      messages: messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      ...inquiryScheduleFields(rawInquiry?.message ?? ""),
    }
  }

  if (viewLookup.error && !isMissingRelationError(viewLookup.error)) {
    throw new Error("Failed to fetch inquiry details")
  }

  const relationalDetails = await tryGetRelationalInquiryDetails(client, inquiryId)

  if (relationalDetails) {
    const belongsToClient =
      relationalDetails.access.user_id === userId || relationalDetails.access.client_id === userId

    if (!belongsToClient) {
      return null
    }

    return relationalDetails.details
  }

  const inquiry = await fetchInquiryBase(client, inquiryId)

  if (!inquiry) return null

  const belongsToClient = inquiry.user_id === userId || inquiry.client_id === userId

  if (!belongsToClient) {
    return null
  }

  return buildInquiryDetails(client, inquiry)
}

export async function getOwnerInquiryDetails(
  client: SupabaseClient,
  ownerId: string,
  inquiryId: string
): Promise<InquiryDetails | null> {
  const orgIds = await getOwnerOrgIds(client, ownerId)

  if (orgIds.length === 0) return null

  const viewLookup = await client
    .from("owner_inquiry_details_view")
    .select("*")
    .eq("id", inquiryId)
    .maybeSingle()

  if (!viewLookup.error && viewLookup.data) {
    const row = viewLookup.data as OwnerInquiryDetailsViewRow

    const viewMessages = parseViewMessages(row.messages)
    const threadMessages = await fetchInquiryMessagesByInquiryId(client, row.id, undefined, row.created_at)
    const messages = threadMessages.length > 0 ? threadMessages : viewMessages
    const rawInquiry = await fetchInquiryBase(client, row.id)

    const venue: DetailVenue = row.venue
      ? {
          id: row.venue.id,
          name: row.venue.name,
          location: row.venue.location,
          price: row.venue.price,
          capacity: row.venue.capacity,
          venue_type: row.venue.venue_type,
          description: row.venue.description,
          additional_info: row.venue.additional_info,
          image: row.venue.image,
          is_available: row.venue.is_available,
          amenities: row.venue.amenities,
          rating: row.venue.rating,
          review_count: row.venue.review_count,
        }
      : {
          id: null,
          name: "Unknown venue",
          location: null,
          price: null,
        }

    return {
      id: row.id,
      date: row.date,
      pax: row.pax,
      status: row.status,
      created_at: row.created_at,
      venue,
      client: row.client ? { id: row.client.id, name: row.client.name, email: row.client.email } : { id: null, name: "Unknown", email: null },
      owner: {
        id: ownerId,
        name: row.owner?.name ?? "Unknown",
        email: row.owner?.email ?? null,
      },
      messages: messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      ...inquiryScheduleFields(rawInquiry?.message ?? ""),
    }
  }

  if (viewLookup.error) {
    throw new Error("Failed to fetch inquiry details")
  }

  return null
}

async function fetchBookingBase(client: SupabaseClient, bookingId: string): Promise<BookingBaseRow | null> {
  const preferredLookup = await client
    .from("bookings")
    .select(
      "id, code, status, created_at, inquiry_id, venue_id, user_id, client_id, owner_id, event_date, start_date, end_date, guest_count, price"
    )
    .eq("id", bookingId)
    .maybeSingle()

  let bookingData = preferredLookup.data as BookingBaseRow | null
  let bookingError = preferredLookup.error

  if (
    bookingError &&
    (isMissingColumnError(bookingError, "inquiry_id") ||
      isMissingColumnError(bookingError, "event_date") ||
      isMissingColumnError(bookingError, "guest_count") ||
      isMissingColumnError(bookingError, "client_id") ||
      isMissingColumnError(bookingError, "owner_id") ||
      isMissingColumnError(bookingError, "price"))
  ) {
    const fallbackLookup = await client
      .from("bookings")
      .select("id, code, status, created_at, venue_id, user_id, start_date, end_date")
      .eq("id", bookingId)
      .maybeSingle()

    bookingData = fallbackLookup.data as BookingBaseRow | null
    bookingError = fallbackLookup.error
  }

  if (bookingError) {
    throw new Error("Failed to fetch booking details")
  }

  return bookingData
}

async function buildBookingDetails(
  client: SupabaseClient,
  booking: BookingBaseRow
): Promise<BookingDetails> {
  const [venue, fallbackClient, fallbackOwner, inquiry] = await Promise.all([
    fetchVenue(client, booking.venue_id),
    fetchProfile(client, booking.client_id ?? booking.user_id ?? null),
    fetchProfile(client, booking.owner_id ?? null),
    booking.inquiry_id ? fetchInquiryBase(client, booking.inquiry_id) : Promise.resolve(null),
  ])

  const inquiryDetails = inquiry ? await buildInquiryDetails(client, inquiry) : null

  return {
    id: booking.id,
    code: booking.code,
    status: booking.status,
    created_at: booking.created_at,
    event_date: booking.event_date ?? null,
    start_date: booking.start_date ?? null,
    end_date: booking.end_date ?? null,
    guest_count: booking.guest_count ?? inquiryDetails?.pax ?? null,
    price: typeof booking.price === "number" ? booking.price : null,
    venue: inquiryDetails?.venue ?? venue,
    client: inquiryDetails?.client.id ? inquiryDetails.client : fallbackClient,
    owner: inquiryDetails?.owner.id ? inquiryDetails.owner : fallbackOwner,
    inquiry: inquiryDetails,
  }
}

export async function getClientBookingDetails(
  client: SupabaseClient,
  userId: string,
  bookingId: string
): Promise<BookingDetails | null> {
  const viewLookup = await client
    .from("client_booking_details_view")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle()

  if (!viewLookup.error && viewLookup.data) {
    const row = viewLookup.data as ClientBookingDetailsViewRow
    const resolvedInquiry = await resolveInquiryForBooking(client, row.id)
    const resolvedInquiryDetails = resolvedInquiry
      ? await buildInquiryDetails(client, resolvedInquiry)
      : null
    const viewMessages = parseViewMessages(row.inquiry?.messages)
    const inquiryMessages =
      resolvedInquiryDetails?.messages?.length
        ? resolvedInquiryDetails.messages
        : viewMessages.length > 0
          ? viewMessages
          : await fetchMessagesForBooking(client, row.id)

    const venue: DetailVenue = row.venue
      ? {
          id: row.venue.id,
          name: row.venue.name,
          location: row.venue.location,
          price: row.venue.price,
          capacity: row.venue.capacity,
          venue_type: row.venue.venue_type,
          description: row.venue.description,
          additional_info: row.venue.additional_info,
          image: row.venue.image,
          is_available: row.venue.is_available,
          amenities: row.venue.amenities,
          rating: row.venue.rating,
          review_count: row.venue.review_count,
        }
      : {
          id: null,
          name: "Unknown venue",
          location: null,
          price: null,
        }

    const inquiry: InquiryDetails =
      resolvedInquiryDetails ?? {
        id: row.id,
        date: row.event_date,
        pax: row.inquiry?.pax ?? null,
        status: row.status,
        created_at: row.created_at,
        venue,
        client: row.client ? { id: row.client.id, name: row.client.name, email: row.client.email } : { id: null, name: "Unknown", email: null },
        owner: row.owner ? { id: null, name: row.owner.name, email: row.owner.email } : { id: null, name: "Unknown", email: null },
        messages: inquiryMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      }

    return {
      id: row.id,
      code: row.code,
      status: row.status,
      created_at: row.created_at,
      event_date: row.event_date,
      start_date: row.event_date,
      end_date: row.end_date,
      guest_count: row.inquiry?.pax ?? null,
      price: row.venue?.price ?? null,
      venue,
      client: row.client ? { id: row.client.id, name: row.client.name, email: row.client.email } : { id: null, name: "Unknown", email: null },
      owner: row.owner ? { id: null, name: row.owner.name, email: row.owner.email } : { id: null, name: "Unknown", email: null },
      inquiry,
    }
  }

  if (viewLookup.error && !isMissingRelationError(viewLookup.error)) {
    throw new Error("Failed to fetch booking details")
  }

  const booking = await fetchBookingBase(client, bookingId)

  if (!booking) return null

  const belongsToClient = booking.user_id === userId || booking.client_id === userId

  if (!belongsToClient) {
    return null
  }

  return buildBookingDetails(client, booking)
}

export async function getOwnerBookingDetails(
  client: SupabaseClient,
  ownerId: string,
  bookingId: string
): Promise<BookingDetails | null> {
  const orgIds = await getOwnerOrgIds(client, ownerId)

  if (orgIds.length === 0) return null

  const viewLookup = await client
    .from("owner_booking_details_view")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle()

  if (!viewLookup.error && viewLookup.data) {
    const row = viewLookup.data as OwnerBookingDetailsViewRow
    const resolvedInquiry = await resolveInquiryForBooking(client, row.id)
    const resolvedInquiryDetails = resolvedInquiry
      ? await buildInquiryDetails(client, resolvedInquiry)
      : null
    const viewMessages = parseViewMessages(row.inquiry?.messages)
    const inquiryMessages =
      resolvedInquiryDetails?.messages?.length
        ? resolvedInquiryDetails.messages
        : viewMessages.length > 0
          ? viewMessages
          : await fetchMessagesForBooking(client, row.id)

    const venue: DetailVenue = row.venue
      ? {
          id: row.venue.id,
          name: row.venue.name,
          location: row.venue.location,
          price: row.venue.price,
          capacity: row.venue.capacity,
          venue_type: row.venue.venue_type,
          description: row.venue.description,
          additional_info: row.venue.additional_info,
          image: row.venue.image,
          is_available: row.venue.is_available,
          amenities: row.venue.amenities,
          rating: row.venue.rating,
          review_count: row.venue.review_count,
        }
      : {
          id: null,
          name: "Unknown venue",
          location: null,
          price: null,
        }

    const inquiry: InquiryDetails =
      resolvedInquiryDetails ?? {
        id: row.id,
        date: row.event_date,
        pax: row.inquiry?.pax ?? null,
        status: row.status,
        created_at: row.created_at,
        venue,
        client: row.client ? { id: row.client.id, name: row.client.name, email: row.client.email } : { id: null, name: "Unknown", email: null },
        owner: {
          id: ownerId,
          name: row.owner?.name ?? "Unknown",
          email: row.owner?.email ?? null,
        },
        messages: inquiryMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      }

    return {
      id: row.id,
      code: row.code,
      status: row.status,
      created_at: row.created_at,
      event_date: row.event_date,
      start_date: row.event_date,
      end_date: row.end_date,
      guest_count: row.inquiry?.pax ?? null,
      price: row.venue?.price ?? null,
      venue,
      client: row.client ? { id: row.client.id, name: row.client.name, email: row.client.email } : { id: null, name: "Unknown", email: null },
      owner: {
        id: ownerId,
        name: row.owner?.name ?? "Unknown",
        email: row.owner?.email ?? null,
      },
      inquiry,
    }
  }

  if (viewLookup.error) {
    throw new Error("Failed to fetch booking details")
  }

  return null
}
