"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Send, Users } from "lucide-react"
import { toast } from "sonner"

import {
  appendInquiryThreadMessage,
  getInquiryThread,
  normalizeInquiryStatus,
  parseInquiryMessage,
  type InquiryMessageRole,
} from "@/lib/services/inquiries/shared"
import { supabaseClient } from "@/lib/supabaseClient"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type InquiryItem = {
  id: string
  status: string | null
  message: string
  created_at: string | null
  venue_id: string | null
  venue_name: string
  date?: string | null
  pax?: number | null
}

type InquiryDetailsModalProps = {
  inquiry: InquiryItem | null
  open: boolean
  onClose: () => void
  role: InquiryMessageRole
  loading?: boolean
  error?: string | null
  onInquiryUpdated?: (nextInquiry: InquiryItem) => void
  onConfirmBooking?: (inquiryId: string) => Promise<void>
  onOwnerStatusChange?: (inquiryId: string, status: "accepted" | "rejected") => Promise<void>
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

  const parsedInquiry = useMemo(() => {
    if (!inquiry?.message) return null
    return parseInquiryMessage(inquiry.message)
  }, [inquiry])

  const thread = useMemo(() => {
    if (!inquiry?.message) return []
    return getInquiryThread(inquiry.message, inquiry.created_at)
  }, [inquiry])

  const resolvedDate = inquiry?.date || parsedInquiry?.eventDate || null
  const resolvedPax = inquiry?.pax ?? parsedInquiry?.guestCount ?? null
  const normalizedStatus = normalizeInquiryStatus(inquiry?.status)

  async function sendMessage(inquiryId: string, message: string, senderRole: InquiryMessageRole) {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession()

    const accessToken = session?.access_token

    if (!accessToken) {
      throw new Error("Please log in to send a message")
    }

    const endpoint = senderRole === "client" ? "/api/client/inquiries" : "/api/owner/inquiries"

    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ inquiryId, message }),
    })

    const data = (await response.json()) as { message?: string }

    if (!response.ok) {
      throw new Error(data?.message || "Failed to send message")
    }
  }

  async function handleSendMessage() {
    if (!inquiry || sending) return

    const nextMessage = draftMessage.trim()
    if (!nextMessage) return

    setSending(true)

    try {
      await sendMessage(inquiry.id, nextMessage, role)

      const nextInquiry = {
        ...inquiry,
        message: appendInquiryThreadMessage(inquiry.message, {
          role,
          message: nextMessage,
        }),
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
      if (onOwnerStatusChange) {
        await onOwnerStatusChange(inquiry.id, status)
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

        const data = (await response.json()) as { message?: string }

        if (!response.ok) {
          throw new Error(data?.message || "Failed to update inquiry")
        }
      }

      onInquiryUpdated?.({ ...inquiry, status })
      toast.success(status === "accepted" ? "Inquiry accepted" : "Inquiry rejected")
    } catch (actionError: unknown) {
      const description = actionError instanceof Error ? actionError.message : "Action failed"
      toast.error("Unable to update inquiry", { description })
    } finally {
      setProcessingAction(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-hidden rounded-3xl border-border/60 p-0">
        <div className="border-b border-border/60 bg-background px-6 py-5">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light">View Details</DialogTitle>
            <DialogDescription>
              Review inquiry details, messages, and available actions in one place.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          {loading && <p className="text-sm text-muted-foreground">Loading details...</p>}
          {error && !loading && <p className="text-sm text-destructive">{error}</p>}

          {inquiry && !loading && !error && (
            <>
              <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-xl font-light text-foreground">{inquiry.venue_name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {formatDate(resolvedDate)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {resolvedPax ?? "Not provided"} pax
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

              <div className="space-y-3 rounded-2xl border border-border/60 bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Messages
                </p>

                <div className="max-h-70 space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-3">
                  {thread.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  ) : (
                    thread.map((item) => {
                      const isClient = item.role === "client"

                      return (
                        <div
                          key={item.id}
                          className={`flex ${isClient ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                              isClient
                                ? "bg-primary text-primary-foreground"
                                : "border border-border/60 bg-background text-foreground"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{item.message}</p>
                            <p
                              className={`mt-1 text-[11px] ${
                                isClient ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {item.role === "client" ? "Client" : "Owner"}
                              {item.createdAt ? ` • ${formatMessageTime(item.createdAt)}` : ""}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Type a message..."
                    disabled={sending || Boolean(processingAction)}
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
                  >
                    {sending ? "Sending..." : "Send"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

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