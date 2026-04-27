export type BookingFollowUpSource = {
  id: string
  code?: string | null
  venue_name?: string | null
  event_date?: string | null
  start_date?: string | null
  status?: string | null
}

export type FollowUpAudience = "client" | "owner"

export type BookingFollowUpStageKey =
  | "confirmation"
  | "seven_days_before"
  | "one_day_before"
  | "post_event"

export type BookingFollowUpStatus = "completed" | "due" | "upcoming"

export type BookingFollowUpItem = {
  key: BookingFollowUpStageKey
  label: string
  description: string
  dueAt: string | null
  status: BookingFollowUpStatus
}

export type BookingNotificationItem = {
  bookingId: string
  bookingCode: string
  venueName: string
  title: string
  body: string
  dueAt: string
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

function parseIsoDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function parseEventDate(source: BookingFollowUpSource) {
  return parseIsoDate(source.event_date ?? source.start_date ?? null)
}

function formatBookingCode(source: BookingFollowUpSource) {
  if (source.code) return source.code
  return source.id.slice(0, 8).toUpperCase()
}

function computeScheduledStatus(
  dueAt: Date,
  now: Date,
  overdueGraceDays: number
): BookingFollowUpStatus {
  const dueAtMs = dueAt.getTime()
  const nowMs = now.getTime()

  if (nowMs < dueAtMs) {
    return "upcoming"
  }

  if (nowMs <= dueAtMs + overdueGraceDays * DAY_IN_MS) {
    return "due"
  }

  return "completed"
}

function getFollowUpCopy(audience: FollowUpAudience) {
  if (audience === "client") {
    return {
      confirmationDescription: "Your booking is confirmed. Review next steps with the venue.",
      sevenDayDescription:
        "Confirm final headcount, program flow, and special requirements with the venue.",
      oneDayDescription:
        "Review arrival instructions, timeline, and contact person before event day.",
      postEventDescription: "Share your feedback and close any remaining requests.",
    }
  }

  return {
    confirmationDescription: "Client confirmation received. Share final booking summary.",
    sevenDayDescription: "Reconfirm headcount, program flow, and setup requirements.",
    oneDayDescription: "Share last-minute instructions and contact person details.",
    postEventDescription: "Send a thank-you note and collect feedback.",
  }
}

export function getBookingFollowUpTimeline(
  source: BookingFollowUpSource,
  options?: {
    now?: Date
    audience?: FollowUpAudience
  }
): BookingFollowUpItem[] {
  const now = options?.now ?? new Date()
  const audience = options?.audience ?? "owner"
  const copy = getFollowUpCopy(audience)
  const normalizedStatus = (source.status ?? "").toLowerCase()
  const isConfirmed = normalizedStatus === "confirmed"
  const eventDate = parseEventDate(source)

  const confirmationItem: BookingFollowUpItem = {
    key: "confirmation",
    label: "Booking confirmed",
    description: copy.confirmationDescription,
    dueAt: source.start_date ?? source.event_date ?? null,
    status: isConfirmed ? "completed" : "upcoming",
  }

  if (!eventDate || !isConfirmed) {
    return [confirmationItem]
  }

  const sevenDaysBefore = new Date(eventDate.getTime() - 7 * DAY_IN_MS)
  const oneDayBefore = new Date(eventDate.getTime() - 1 * DAY_IN_MS)
  const postEvent = new Date(eventDate.getTime() + 1 * DAY_IN_MS)

  return [
    confirmationItem,
    {
      key: "seven_days_before",
      label: "7-day check-in",
      description: copy.sevenDayDescription,
      dueAt: sevenDaysBefore.toISOString(),
      status: computeScheduledStatus(sevenDaysBefore, now, 2),
    },
    {
      key: "one_day_before",
      label: "1-day final reminder",
      description: copy.oneDayDescription,
      dueAt: oneDayBefore.toISOString(),
      status: computeScheduledStatus(oneDayBefore, now, 2),
    },
    {
      key: "post_event",
      label: "Post-event follow-up",
      description: copy.postEventDescription,
      dueAt: postEvent.toISOString(),
      status: computeScheduledStatus(postEvent, now, 7),
    },
  ]
}

export function getDueFollowUpNotifications(
  bookings: BookingFollowUpSource[],
  options?: {
    now?: Date
    audience?: FollowUpAudience
  }
): BookingNotificationItem[] {
  const now = options?.now ?? new Date()
  const audience = options?.audience ?? "owner"

  return bookings
    .filter((booking) => (booking.status ?? "").toLowerCase() === "confirmed")
    .flatMap((booking) => {
      const timeline = getBookingFollowUpTimeline(booking, { now, audience })

      return timeline
        .filter((item) => item.key !== "confirmation" && item.status === "due" && item.dueAt)
        .map((item) => ({
          bookingId: booking.id,
          bookingCode: formatBookingCode(booking),
          venueName: booking.venue_name ?? "Unknown venue",
          title: item.label,
          body: item.description,
          dueAt: item.dueAt as string,
        }))
    })
}