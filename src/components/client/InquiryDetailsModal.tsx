"use client"

import Image from "next/image"
import { useState } from "react"
import { CalendarDays, ChevronDown, Send, Tag, Users } from "lucide-react"
import { toast } from "sonner"

import {
  normalizeInquiryStatus,
} from "@/lib/services/inquiries/shared"
import { supabaseClient } from "@/lib/supabaseClient"
import { sendMessage } from "@/lib/services/details/client"
import type { DetailRole, InquiryDetails } from "@/lib/services/details/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/common/StarRating"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type InquiryDetailsModalProps = {
  inquiry: InquiryDetails | null
  open: boolean
  onClose: () => void
  role: DetailRole
  loading?: boolean
  error?: string | null
  onInquiryUpdated?: (nextInquiry: InquiryDetails) => void
  onConfirmBooking?: (inquiryId: string) => Promise<void>
  onOwnerStatusChange?: (
    inquiryId: string,
    status: "accepted" | "rejected"
  ) => Promise<{ status?: string | null } | void>
}

function getStatusVariant(status: string | null) {
  const s = normalizeInquiryStatus(status)

  if (s === "accepted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (s === "rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  return "border-amber-200 bg-amber-50 text-amber-700"
}

function getStatusLabel(status: string | null) {
  const s = normalizeInquiryStatus(status)

  if (s === "accepted") return "Accepted"
  if (s === "rejected") return "Declined"
  return "Waiting for response"
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not provided"

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatMessageTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

type ToggleSectionProps = {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function ToggleSection({ title, defaultOpen = true, children }: ToggleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="rounded-2xl border border-border/60 bg-background">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{title}</p>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-3 border-t border-border/60 p-4">{children}</div>}
    </section>
  )
}

export default function InquiryDetailsModal({
  inquiry,
  open,
  onClose,
  role,
  loading = false,
  error = null,
  onInquiryUpdated,
  onConfirmBooking,
  onOwnerStatusChange,
}: InquiryDetailsModalProps) {
  const [draftMessage, setDraftMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [processingAction, setProcessingAction] = useState<null | "confirm" | "accept" | "reject">(
    null
  )
  const normalizedStatus = normalizeInquiryStatus(inquiry?.status)
  const venueImage = inquiry?.venue.image?.trim() || "/images/placeholder-venue.jpg"
  const venueAmenities = inquiry?.venue.amenities ?? []

  async function handleSendMessage() {
    if (!inquiry || sending) return

    const nextMessage = draftMessage.trim()
    if (!nextMessage) return

    setSending(true)

    try {
      await sendMessage(inquiry.id, nextMessage, role)

      const nextInquiry = {
        ...inquiry,
        messages: [
          ...inquiry.messages,
          {
            id: crypto.randomUUID(),
            message: nextMessage,
            sender_role: role,
            created_at: new Date().toISOString(),
          },
        ],
      }

      onInquiryUpdated?.(nextInquiry)
      setDraftMessage("")
      toast.success("Message sent")
    } catch (sendError: unknown) {
      const description = sendError instanceof Error ? sendError.message : "Failed to send message"
      toast.error("Unable to send message", { description })
    } finally {
      setSending(false)
    }
  }

  async function handleConfirm() {
    if (!inquiry || processingAction) return

    setProcessingAction("confirm")

    try {
      if (onConfirmBooking) {
        await onConfirmBooking(inquiry.id)
      } else {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        const accessToken = session?.access_token

        if (!accessToken) {
          throw new Error("Please log in to confirm booking")
        }

        const response = await fetch("/api/client/inquiries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ inquiryId: inquiry.id }),
        })

        const data = (await response.json()) as { message?: string }

        if (!response.ok) {
          throw new Error(data?.message || "Failed to confirm booking")
        }
      }

      toast.success("Booking confirmed")
    } catch (confirmError: unknown) {
      const description =
        confirmError instanceof Error ? confirmError.message : "Failed to confirm booking"
      toast.error("Unable to confirm booking", { description })
    } finally {
      setProcessingAction(null)
    }
  }

  async function handleOwnerAction(status: "accepted" | "rejected") {
    if (!inquiry || processingAction) return

    setProcessingAction(status === "accepted" ? "accept" : "reject")

    try {
      let savedStatus: string | null = status

      if (onOwnerStatusChange) {
        const result = await onOwnerStatusChange(inquiry.id, status)
        savedStatus = result?.status ?? status
      } else {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        const accessToken = session?.access_token

        if (!accessToken) {
          throw new Error("Please log in to update inquiry status")
        }

        const response = await fetch("/api/owner/inquiries", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ inquiryId: inquiry.id, status }),
        })

        const data = (await response.json()) as { message?: string; status?: string | null }

        if (!response.ok) {
          throw new Error(data?.message || "Failed to update inquiry")
        }

        savedStatus = data.status ?? status
      }

      onInquiryUpdated?.({ ...inquiry, status: savedStatus })
      toast.success(savedStatus === "accepted" ? "Inquiry accepted" : "Inquiry rejected")
    } catch (actionError: unknown) {
      const description = actionError instanceof Error ? actionError.message : "Action failed"
      toast.error("Unable to update inquiry", { description })
    } finally {
      setProcessingAction(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex h-[92dvh] w-[calc(100%-1rem)] max-h-[92dvh] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-border/60 p-0 sm:h-[88vh] sm:max-h-[88vh] sm:rounded-3xl">
        <div className="shrink-0 border-b border-border/60 bg-background px-4 py-4 sm:px-6 sm:py-5">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light">View Details</DialogTitle>
            <DialogDescription>
              Review inquiry details, messages, and available actions in one place.
            </DialogDescription>
          </DialogHeader>
        </div>

  <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {loading && (
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-xl bg-muted" />
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
            </div>
          )}
          {error && !loading && <p className="text-sm text-destructive">{error}</p>}

          {inquiry && !loading && !error && (
            <>
              <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-xl font-light text-foreground">{inquiry.venue.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {inquiry.venue.location ?? "Location not provided"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {formatDate(inquiry.date)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {inquiry.pax ?? "Not provided"} pax
                      </span>
                    </div>
                  </div>

                  <Badge
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusVariant(
                      inquiry.status
                    )}`}
                  >
                    {getStatusLabel(inquiry.status)}
                  </Badge>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                {role === "client" ? (
                  <p>
                    <span className="font-medium text-foreground">Owner:</span> {inquiry.owner.name}
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p>
                      <span className="font-medium text-foreground">Client:</span> {inquiry.client.name}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Contact:</span>{" "}
                      {inquiry.client.email ?? "No email provided"}
                    </p>
                  </div>
                )}
              </div>

              <ToggleSection title="Venue Details" defaultOpen>
                <div className="relative h-44 overflow-hidden rounded-xl border border-border/60 sm:h-52">
                  <Image src={venueImage} alt={inquiry.venue.name} fill className="object-cover" />
                </div>

                <StarRating
                  rating={Number(inquiry.venue.rating ?? 0)}
                  reviewCount={Number(inquiry.venue.review_count ?? 0)}
                />

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Venue type</p>
                    <p className="mt-1 text-sm text-foreground">{inquiry.venue.venue_type ?? "Not provided"}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Capacity</p>
                    <p className="mt-1 text-sm text-foreground">
                      {typeof inquiry.venue.capacity === "number" ? `${inquiry.venue.capacity} pax` : "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Starting price</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-foreground">
                      <Tag className="h-3.5 w-3.5" />
                      {typeof inquiry.venue.price === "number" ? `₱${inquiry.venue.price.toLocaleString()}` : "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Availability</p>
                    <p className="mt-1 text-sm text-foreground">
                      {inquiry.venue.is_available === null || inquiry.venue.is_available === undefined
                        ? "Not set"
                        : inquiry.venue.is_available
                          ? "Available"
                          : "Unavailable"}
                    </p>
                  </div>
                </div>

                {venueAmenities.length > 0 && (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Amenities</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {venueAmenities.map((item) => (
                        <Badge key={item} variant="secondary" className="rounded-full text-[11px] font-normal">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(inquiry.venue.description || inquiry.venue.additional_info) && (
                  <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                    {inquiry.venue.description && (
                      <p className="text-sm text-muted-foreground">{inquiry.venue.description}</p>
                    )}
                    {inquiry.venue.additional_info && (
                      <p className="text-sm text-muted-foreground">{inquiry.venue.additional_info}</p>
                    )}
                  </div>
                )}
              </ToggleSection>

              <ToggleSection title="Messages" defaultOpen={false}>
                <div className="no-scrollbar max-h-70 space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-3">
                  {inquiry.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  ) : (
                    inquiry.messages.map((item) => {
                      const isOwnMessage = item.sender_role === role

                      return (
                        <div
                          key={item.id}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                              isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : "border border-border/60 bg-background text-foreground"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{item.message}</p>
                            <p
                              className={`mt-1 text-[11px] ${
                                isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {item.sender_role === "client" ? "Client" : "Owner"}
                              {item.created_at ? ` • ${formatMessageTime(item.created_at)}` : ""}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Type a message..."
                    disabled={sending || Boolean(processingAction)}
                    className="w-full"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        void handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => void handleSendMessage()}
                    disabled={sending || Boolean(processingAction) || !draftMessage.trim()}
                    className="w-full sm:w-auto"
                  >
                    {sending ? "Sending..." : "Send"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </ToggleSection>

              <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-2">
                {role === "client" && normalizedStatus === "accepted" && (
                  <Button
                    type="button"
                    onClick={() => void handleConfirm()}
                    disabled={Boolean(processingAction) || sending}
                  >
                    {processingAction === "confirm" ? "Confirming..." : "Confirm Booking"}
                  </Button>
                )}

                {role === "owner" && normalizedStatus === "pending" && (
                  <>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void handleOwnerAction("rejected")}
                      disabled={Boolean(processingAction) || sending}
                    >
                      {processingAction === "reject" ? "Rejecting..." : "Reject"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleOwnerAction("accepted")}
                      disabled={Boolean(processingAction) || sending}
                    >
                      {processingAction === "accept" ? "Accepting..." : "Accept"}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
