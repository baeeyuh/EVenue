import type { InquiryStatus } from "@/types/inquiry-booking"

export type ParsedInquiryMessage = {
  venue: string
  eventDate: string
  eventType: string
  guestCount: number | null
  startTime: string
  endTime: string
  contactNumber: string
  email: string
  fullName: string
  actualMessage: string
}

export type InquiryMessageRole = "client" | "owner"

export type InquiryThreadMessage = {
  id: string
  role: InquiryMessageRole
  message: string
  createdAt: string
}

const INQUIRY_THREAD_MARKER = "\n\n---THREAD---\n"

function splitInquiryMessage(message: string) {
  const markerIndex = message.indexOf(INQUIRY_THREAD_MARKER)

  if (markerIndex < 0) {
    return {
      baseMessage: message,
      rawThread: "",
    }
  }

  return {
    baseMessage: message.slice(0, markerIndex),
    rawThread: message.slice(markerIndex + INQUIRY_THREAD_MARKER.length),
  }
}

function parseStoredThread(rawThread: string): InquiryThreadMessage[] {
  if (!rawThread.trim()) return []

  try {
    const parsed = JSON.parse(rawThread) as unknown

    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is InquiryThreadMessage => {
        if (!item || typeof item !== "object") return false

        const candidate = item as Partial<InquiryThreadMessage>

        return (
          typeof candidate.id === "string" &&
          (candidate.role === "client" || candidate.role === "owner") &&
          typeof candidate.message === "string" &&
          typeof candidate.createdAt === "string"
        )
      })
      .map((item) => ({
        ...item,
        message: item.message.trim(),
      }))
      .filter((item) => item.message.length > 0)
  } catch {
    return []
  }
}

export function appendInquiryThreadMessage(
  message: string,
  payload: {
    role: InquiryMessageRole
    message: string
    createdAt?: string
  }
) {
  const nextMessage = payload.message.trim()

  if (!nextMessage) {
    return message
  }

  const { baseMessage, rawThread } = splitInquiryMessage(message)
  const thread = parseStoredThread(rawThread)

  thread.push({
    id: crypto.randomUUID(),
    role: payload.role,
    message: nextMessage,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  })

  return `${baseMessage}${INQUIRY_THREAD_MARKER}${JSON.stringify(thread)}`
}

export function getInquiryThread(
  message: string,
  createdAt?: string | null
): InquiryThreadMessage[] {
  const { baseMessage, rawThread } = splitInquiryMessage(message)
  const parsed = parseInquiryMessage(baseMessage)
  const initialMessage = parsed.actualMessage.trim()

  const initialThread = initialMessage
    ? [
        {
          id: "initial",
          role: "client" as const,
          message: initialMessage,
          createdAt: createdAt ?? new Date(0).toISOString(),
        },
      ]
    : []

  const appendedThread = parseStoredThread(rawThread)

  return [...initialThread, ...appendedThread]
}

export function normalizeInquiryStatus(status: string | null | undefined): InquiryStatus {
  const value = (status ?? "").trim().toLowerCase()

  if (value === "accepted" || value === "responded") return "accepted"
  if (value === "rejected" || value === "closed" || value === "declined") return "rejected"
  return "pending"
}

export function composeInquiryMessage(payload: {
  venueLabel: string
  eventDate: string
  message: string
  eventType?: string
  guestCount?: number
  startTime?: string
  endTime?: string
  contactNumber?: string
  email?: string
  fullName?: string
}) {
  const lines = [
    `Venue: ${payload.venueLabel}`,
    `Event date: ${payload.eventDate}`,
    payload.eventType ? `Event type: ${payload.eventType}` : null,
    payload.guestCount ? `Guest count: ${payload.guestCount}` : null,
    payload.startTime ? `Start time: ${payload.startTime}` : null,
    payload.endTime ? `End time: ${payload.endTime}` : null,
    payload.contactNumber ? `Contact number: ${payload.contactNumber}` : null,
    payload.email ? `Email: ${payload.email}` : null,
    payload.fullName ? `Full name: ${payload.fullName}` : null,
    "",
    "Message:",
    payload.message,
  ]

  return lines.filter(Boolean).join("\n")
}

export function parseInquiryMessage(message: string): ParsedInquiryMessage {
  const { baseMessage } = splitInquiryMessage(message)
  const lines = baseMessage.split("\n")

  const getValue = (label: string) => {
    const line = lines.find((item) => item.startsWith(`${label}: `))
    return line ? line.replace(`${label}: `, "").trim() : ""
  }

  const eventDate = getValue("Event date")
  const guestCountRaw = getValue("Guest count")
  const parsedGuestCount = Number(guestCountRaw)

  const messageIndex = lines.findIndex((line) => line.trim() === "Message:")
  const actualMessage =
    messageIndex >= 0 ? lines.slice(messageIndex + 1).join("\n").trim() : baseMessage

  return {
    venue: getValue("Venue"),
    eventDate,
    eventType: getValue("Event type"),
    guestCount: Number.isFinite(parsedGuestCount) ? parsedGuestCount : null,
    startTime: getValue("Start time"),
    endTime: getValue("End time"),
    contactNumber: getValue("Contact number"),
    email: getValue("Email"),
    fullName: getValue("Full name"),
    actualMessage,
  }
}

export function isMissingColumnError(error: unknown, columnName: string) {
  if (!error || typeof error !== "object") return false

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string }
  const haystack = [candidate.message, candidate.details, candidate.hint]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase()

  const mentionsColumn = haystack.includes(columnName.toLowerCase())

  return (
    mentionsColumn &&
    (candidate.code === "42703" || candidate.code === "PGRST204")
  )
}
