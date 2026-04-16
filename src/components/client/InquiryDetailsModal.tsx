"use client"

import { useMemo } from "react"
import {
  Mail,
  Phone,
  User2,
  CalendarDays,
  Users,
  Clock3,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
}

type InquiryDetailsModalProps = {
  inquiry: InquiryItem | null
  loading: boolean
  error: string | null
  open: boolean
  onClose: () => void
}

function getStatusVariant(status: string | null) {
  const s = (status ?? "").toLowerCase()

  if (s === "responded") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (s === "closed") {
    return "border-slate-200 bg-slate-100 text-slate-700"
  }

  return "border-amber-200 bg-amber-50 text-amber-700"
}

function formatInquiryDate(value: string | null) {
  if (!value) return "Unknown date"

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function parseInquiryMessage(message: string) {
  const lines = message.split("\n")

  const getValue = (label: string) => {
    const line = lines.find((item) => item.startsWith(`${label}: `))
    return line ? line.replace(`${label}: `, "").trim() : ""
  }

  const messageIndex = lines.findIndex((line) => line.trim() === "Message:")
  const actualMessage =
    messageIndex >= 0 ? lines.slice(messageIndex + 1).join("\n").trim() : message

  return {
    venue: getValue("Venue"),
    eventDate: getValue("Event date"),
    eventType: getValue("Event type"),
    guestCount: getValue("Guest count"),
    startTime: getValue("Start time"),
    endTime: getValue("End time"),
    contactNumber: getValue("Contact number"),
    email: getValue("Email"),
    fullName: getValue("Full name"),
    actualMessage,
  }
}

export default function InquiryDetailsModal({
  inquiry,
  loading,
  error,
  open,
  onClose,
}: InquiryDetailsModalProps) {
  const parsed = useMemo(() => {
    if (!inquiry?.message) {
      return {
        venue: "",
        eventDate: "",
        eventType: "",
        guestCount: "",
        startTime: "",
        endTime: "",
        contactNumber: "",
        email: "",
        fullName: "",
        actualMessage: "",
      }
    }

    return parseInquiryMessage(inquiry.message)
  }, [inquiry])

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-[2rem] border-border/60 p-0">
        <div className="border-b border-border/60 bg-gradient-to-br from-primary/8 via-background to-background px-6 py-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="font-serif text-2xl font-light">
              Inquiry details
            </DialogTitle>

            <DialogDescription className="text-sm text-muted-foreground">
              Review your inquiry for{" "}
              <span className="font-medium text-foreground">
                {inquiry?.venue_name ?? "this venue"}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading inquiry details...</p>
          )}

          {error && !loading && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {inquiry && !loading && !error && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div>
                  <p className="font-medium text-foreground">{inquiry.venue_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sent {formatInquiryDate(inquiry.created_at)}
                  </p>
                </div>

                <Badge
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusVariant(
                    inquiry.status
                  )}`}
                >
                  {inquiry.status ?? "Pending"}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Full name
                  </Label>
                  <div className="relative">
                    <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      readOnly
                      value={parsed.fullName}
                      className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      readOnly
                      value={parsed.email}
                      className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Contact number
                  </Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      readOnly
                      value={parsed.contactNumber}
                      className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Event date
                  </Label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      readOnly
                      value={parsed.eventDate}
                      className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Guest count
                  </Label>
                  <div className="relative">
                    <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      readOnly
                      value={parsed.guestCount}
                      className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Start time
                  </Label>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      readOnly
                      value={parsed.startTime}
                      className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    End time
                  </Label>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      readOnly
                      value={parsed.endTime}
                      className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Event type
                </Label>
                <Input
                  readOnly
                  value={parsed.eventType}
                  className="h-11 rounded-xl border-border/60 bg-muted/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Message / special requests
                </Label>
                <textarea
                  readOnly
                  value={parsed.actualMessage}
                  className="min-h-[140px] w-full rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm outline-none"
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}