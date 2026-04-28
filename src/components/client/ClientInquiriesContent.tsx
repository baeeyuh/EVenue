"use client"

import { useEffect, useState } from "react"
import { CalendarDays, MessageSquare, Search } from "lucide-react"
import { toast } from "sonner"

import { supabaseClient } from "@/lib/supabaseClient"
import InquiryDetailsModal from "@/components/client/InquiryDetailsModal"
import { getInquiryDetails } from "@/lib/services/details/client"
import type { InquiryDetails } from "@/lib/services/details/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PageSectionHeader from "@/components/common/PageSectionHeader"

type InquiryListItem = {
  id: string
  status: string | null
  message: string
  created_at: string | null
  venue_name: string
}

function formatInquiryDate(value: string | null) {
  if (!value) return "Unknown date"

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function getStatusVariant(status: string | null) {
  const s = (status ?? "").toLowerCase()

  if (s === "accepted" || s === "responded") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (s === "rejected" || s === "declined" || s === "closed") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  return "border-amber-200 bg-amber-50 text-amber-700"
}

function getInquiryStatusLabel(status: string | null) {
  const s = (status ?? "").toLowerCase()

  if (s === "accepted" || s === "responded") {
    return "Accepted"
  }

  if (s === "rejected" || s === "declined" || s === "closed") {
    return "Declined"
  }

  return "Waiting for response"
}

export default function ClientInquiriesContent() {
  const [inquiries, setInquiries] = useState<InquiryListItem[]>([])
  const [filteredInquiries, setFilteredInquiries] = useState<InquiryListItem[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedInquiry, setSelectedInquiry] = useState<InquiryDetails | null>(null)
  const [detailsCache, setDetailsCache] = useState<Record<string, InquiryDetails>>({})
  const [openingInquiryId, setOpeningInquiryId] = useState<string | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadInquiries() {
      setLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      const user = session?.user
      const accessToken = session?.access_token

      if (!user || !accessToken) {
        if (!active) return
        setInquiries([])
        setFilteredInquiries([])
        setLoading(false)
        setError("Please log in to view your inquiries")
        return
      }

      try {
        const response = await fetch("/api/client/inquiries", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!response.ok) {
          throw new Error("Failed to load inquiries")
        }

  const data = (await response.json()) as InquiryListItem[]

        if (!active) return
        setInquiries(data)
        setFilteredInquiries(data)
      } catch (fetchError: unknown) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load inquiries")
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    void loadInquiries()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      setFilteredInquiries(inquiries)
      return
    }

    setFilteredInquiries(
      inquiries.filter((inquiry) => {
        return (
          inquiry.venue_name.toLowerCase().includes(query) ||
          inquiry.message.toLowerCase().includes(query) ||
          inquiry.id.toLowerCase().includes(query) ||
          (inquiry.status ?? "").toLowerCase().includes(query)
        )
      })
    )
  }, [search, inquiries])

  async function handleViewInquiry(inquiryId: string) {
    const cached = detailsCache[inquiryId]

    if (cached) {
      setDetailsError(null)
      setSelectedInquiry(cached)
      return
    }

    setOpeningInquiryId(inquiryId)
    setDetailsError(null)

    try {
      const fullInquiry = await getInquiryDetails(inquiryId, "client")
      setDetailsCache((prev) => ({ ...prev, [inquiryId]: fullInquiry }))
      setSelectedInquiry(fullInquiry)
    } catch (detailsFetchError: unknown) {
      const message =
        detailsFetchError instanceof Error
          ? detailsFetchError.message
          : "Failed to load inquiry details"
      setDetailsError(message)
      toast.error("Unable to load inquiry details", { description: message })
    } finally {
      setOpeningInquiryId(null)
    }
  }

  async function handleConfirmBooking(inquiryId: string) {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      const accessToken = session?.access_token

      if (!accessToken) {
        throw new Error("Please log in to confirm your booking")
      }

      const response = await fetch("/api/client/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ inquiryId }),
      })

      const data = (await response.json()) as { created?: boolean; message?: string }

      if (!response.ok) {
        throw new Error(data?.message || "Failed to confirm booking")
      }

      toast.success(data.created ? "Booking confirmed" : "Booking already exists", {
        description: data.created
          ? "Your accepted inquiry has been converted into a booking."
          : "This inquiry was already confirmed earlier.",
      })

      setInquiries((prev) => prev.map((item) => (item.id === inquiryId ? { ...item, status: "accepted" } : item)))
      setFilteredInquiries((prev) =>
        prev.map((item) => (item.id === inquiryId ? { ...item, status: "accepted" } : item))
      )

      setSelectedInquiry((prev) => (prev && prev.id === inquiryId ? { ...prev, status: "accepted" } : prev))
    } catch (confirmError: unknown) {
      const message =
        confirmError instanceof Error ? confirmError.message : "Failed to confirm booking"
      toast.error("Booking confirmation failed", {
        description: message,
      })
    }
  }

  function handleInquiryUpdated(nextInquiry: InquiryDetails) {
    setInquiries((prev) =>
      prev.map((item) =>
        item.id === nextInquiry.id
          ? {
              ...item,
              status: nextInquiry.status,
              message: nextInquiry.messages.at(-1)?.message ?? item.message,
              created_at: nextInquiry.created_at,
              venue_name: nextInquiry.venue.name,
            }
          : item
      )
    )
    setDetailsCache((prev) => ({ ...prev, [nextInquiry.id]: nextInquiry }))
    setSelectedInquiry(nextInquiry)
  }

  return (
    <>
      <main className="min-h-screen bg-[#fafaf8] text-foreground">
        <PageSectionHeader
          eyebrow="My Inquiries"
          title="Inquiries"
          description="Track venue questions, availability requests, and communication status."
          maxWidthClassName="max-w-5xl"
        />

        <section className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-6 max-w-md">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search inquiries..."
                className="h-11 rounded-full border-border/60 bg-background pl-10"
              />
            </div>
          </div>

          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          )}

          {error && !loading && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {!loading && !error && filteredInquiries.length === 0 && (
            <div className="rounded-[2rem] border border-border/60 bg-card/70 px-6 py-16 text-center">
              <p className="text-base text-muted-foreground">No inquiries yet.</p>
              <p className="mt-2 text-sm text-muted-foreground/80">
                Inquiries you send to venues will appear here.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="rounded-2xl border border-border/60 bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {inquiry.id.slice(0, 8).toUpperCase()}
                    </p>

                    <h2 className="font-serif text-2xl font-light text-foreground">
                      {inquiry.venue_name}
                    </h2>
                  </div>

                  <Badge
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusVariant(
                      inquiry.status
                    )}`}
                  >
                    {getInquiryStatusLabel(inquiry.status)}
                  </Badge>
                </div>

                <div className="mb-4 border-t border-border/50 pt-4" />

                <div className="mb-5 flex gap-3">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="line-clamp-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {inquiry.message}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>Sent {formatInquiryDate(inquiry.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleViewInquiry(inquiry.id)}
                      disabled={openingInquiryId === inquiry.id}
                      className="rounded-full border-border/60 bg-background hover:bg-muted"
                    >
                      {openingInquiryId === inquiry.id ? "Loading..." : "View Details"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {selectedInquiry && (
        <InquiryDetailsModal
          inquiry={selectedInquiry}
          open={Boolean(selectedInquiry)}
          onClose={() => setSelectedInquiry(null)}
          role="client"
          error={detailsError}
          onInquiryUpdated={handleInquiryUpdated}
          onConfirmBooking={handleConfirmBooking}
        />
      )}
    </>
  )
}