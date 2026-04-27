import type { SupabaseClient } from "@supabase/supabase-js"

import { getOwnerOrgIds } from "@/lib/services/owner/organizations"
import { getInquiryThread, isMissingColumnError } from "@/lib/services/inquiries/shared"
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
    .select("id, name, location, price, capacity, venue_type, description, additional_info, image, is_available")
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
  } | null
  let venueError = preferredLookup.error

  if (
    venueError &&
    (isMissingColumnError(venueError, "capacity") ||
      isMissingColumnError(venueError, "venue_type") ||
      isMissingColumnError(venueError, "additional_info") ||
      isMissingColumnError(venueError, "is_available"))
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
  }
}

function fallbackMessagesFromInquiry(inquiry: InquiryBaseRow): DetailMessage[] {
  return getInquiryThread(inquiry.message, inquiry.created_at)
    .map((message) => ({
      id: message.id,
      message: message.message,
      sender_role: message.role,
      created_at: message.createdAt,
    }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

async function fetchMessages(client: SupabaseClient, inquiry: InquiryBaseRow): Promise<DetailMessage[]> {
  const messageQuery = await client
    .from("inquiry_messages")
    .select("id, message, sender_role, created_at")
    .eq("inquiry_id", inquiry.id)
    .order("created_at", { ascending: true })

  if (messageQuery.error) {
    return fallbackMessagesFromInquiry(inquiry)
  }

  const messages = ((messageQuery.data ?? []) as Array<{
    id: string
    message: string | null
    sender_role: string | null
    created_at: string | null
  }>).map((item) => ({
    id: item.id,
    message: item.message ?? "",
    sender_role: (item.sender_role === "owner" ? "owner" : "client") as "owner" | "client",
    created_at: item.created_at ?? new Date(0).toISOString(),
  }))

  if (messages.length > 0) {
    return messages
  }

  return fallbackMessagesFromInquiry(inquiry)
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
  }
}

export async function getClientInquiryDetails(
  client: SupabaseClient,
  userId: string,
  inquiryId: string
): Promise<InquiryDetails | null> {
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

  const relationalDetails = await tryGetRelationalInquiryDetails(client, inquiryId)

  if (relationalDetails?.access.venue_id) {
    const venueOrgLookup = await client
      .from("venues")
      .select("organization_id")
      .eq("id", relationalDetails.access.venue_id)
      .maybeSingle()

    const organizationId =
      (venueOrgLookup.data as { organization_id?: string | null } | null)?.organization_id ?? null

    if (!organizationId || !orgIds.includes(organizationId)) {
      return null
    }

    return relationalDetails.details
  }

  const inquiry = await fetchInquiryBase(client, inquiryId)

  if (!inquiry) return null

  if (!inquiry.venue_id) return null

  const venueOrgLookup = await client
    .from("venues")
    .select("organization_id")
    .eq("id", inquiry.venue_id)
    .maybeSingle()

  const organizationId =
    (venueOrgLookup.data as { organization_id?: string | null } | null)?.organization_id ?? null

  if (!organizationId || !orgIds.includes(organizationId)) {
    return null
  }

  return buildInquiryDetails(client, inquiry)
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
  const booking = await fetchBookingBase(client, bookingId)

  if (!booking) return null

  if (!booking.venue_id) return null

  const orgIds = await getOwnerOrgIds(client, ownerId)

  if (orgIds.length === 0) return null

  const venueOrgLookup = await client
    .from("venues")
    .select("organization_id")
    .eq("id", booking.venue_id)
    .maybeSingle()

  const organizationId =
    (venueOrgLookup.data as { organization_id?: string | null } | null)?.organization_id ?? null

  if (!organizationId || !orgIds.includes(organizationId)) {
    return null
  }

  return buildBookingDetails(client, booking)
}
