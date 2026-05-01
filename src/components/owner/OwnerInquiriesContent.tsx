"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { supabaseClient } from "@/lib/supabaseClient"
import InquiryDetailsModal from "@/components/client/InquiryDetailsModal"
import { getInquiryDetails } from "@/lib/services/details/client"
import type { InquiryDetails } from "@/lib/services/details/types"
import PageSectionHeader from "@/components/common/PageSectionHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type OwnerInquiry = {
  id: string
  message: string
  status: string | null
  created_at: string | null
  venue_id: string
  venue_name: string
  client_name: string | null
  client_email: string | null
  date: string
  pax: number | null
}

function formatDate(value: string | null) {
  if (!value) return "Unknown date"
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function getStatusLabel(status: string | null) {
  const s = (status ?? "").toLowerCase()
  if (s === "accepted") return "Accepted"
  if (s === "rejected") return "Declined"
  return "Waiting for response"
}

function getStatusClasses(status: string | null) {
  const s = (status ?? "").toLowerCase()

  if (s === "accepted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (s === "rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  return "border-amber-200 bg-amber-50 text-amber-700"
}

export default function OwnerInquiriesContent() {
  const [inquiries, setInquiries] = useState<OwnerInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoadingById, setActionLoadingById] = useState<Record<string, boolean>>({})
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryDetails | null>(null)
  const [detailsCache, setDetailsCache] = useState<Record<string, InquiryDetails>>({})
  const [openingInquiryId, setOpeningInquiryId] = useState<string | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadInquiries() {
      setError(null)
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) {
        if (!active) return
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/owner/inquiries", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) throw new Error("Failed to fetch owner inquiries")

        const data = (await response.json()) as OwnerInquiry[]
        if (!active) return
        setInquiries(data)
      } catch (fetchError: unknown) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch owner inquiries")
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

  async function handleAction(inquiryId: string, status: "accepted" | "rejected") {
    setActionLoadingById((prev) => ({ ...prev, [inquiryId]: true }))

    try {
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
        body: JSON.stringify({ id: inquiryId, status }),
      })

      const data = (await response.json()) as Partial<OwnerInquiry> & { message?: string }

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update inquiry")
      }

      const savedStatus = data.status ?? status

      setInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.id === inquiryId
            ? {
                ...inquiry,
                status: savedStatus,
              }
            : inquiry
        )
      )
      setDetailsCache((prev) => {
        const cachedInquiry = prev[inquiryId]
        if (!cachedInquiry) return prev

        return {
          ...prev,
          [inquiryId]: {
            ...cachedInquiry,
            status: savedStatus,
          },
        }
      })
      setSelectedInquiry((prev) =>
        prev && prev.id === inquiryId
          ? {
              ...prev,
              status: savedStatus,
            }
          : prev
      )

      return { status: savedStatus }
    } catch (actionError: unknown) {
      throw actionError
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [inquiryId]: false }))
    }
  }

  async function handleOpen(inquiryId: string) {
    const cached = detailsCache[inquiryId]

    if (cached) {
      setDetailsError(null)
      setSelectedInquiry(cached)
      return
    }

    setOpeningInquiryId(inquiryId)
    setDetailsError(null)

    try {
      const inquiry = await getInquiryDetails(inquiryId, "owner")
      setDetailsCache((prev) => ({ ...prev, [inquiryId]: inquiry }))
      setSelectedInquiry(inquiry)
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
              date: nextInquiry.date ?? item.date,
              pax: nextInquiry.pax ?? item.pax,
            }
          : item
      )
    )
    setDetailsCache((prev) => ({ ...prev, [nextInquiry.id]: nextInquiry }))
    setSelectedInquiry(nextInquiry)
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] text-foreground">
      <PageSectionHeader
        eyebrow="Client Inquiries"
        title="Inquiries"
        description="Review and respond to inquiries from potential clients."
        maxWidthClassName="max-w-6xl"
      />

      <section className="mx-auto max-w-6xl space-y-4 px-6 py-10">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="h-32 animate-pulse border-border/60 bg-muted" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          inquiries.map((inquiry) => {
            const isLoadingAction = Boolean(actionLoadingById[inquiry.id])

            return (
              <Card key={inquiry.id} className="border-border/60">
                <CardContent className="space-y-4 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-serif text-2xl font-light">{inquiry.venue_name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Sent {formatDate(inquiry.created_at)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${getStatusClasses(
                        inquiry.status
                      )}`}
                    >
                      {getStatusLabel(inquiry.status)}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Client:</span>{" "}
                      {inquiry.client_name ?? "Unknown client"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Email:</span>{" "}
                      {inquiry.client_email ?? "No email provided"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Date:</span>{" "}
                      {inquiry.date ? formatDate(inquiry.date) : "Not provided"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Pax:</span>{" "}
                      {inquiry.pax ?? "Not provided"}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-border/60"
                      onClick={() => void handleOpen(inquiry.id)}
                      disabled={isLoadingAction || openingInquiryId === inquiry.id}
                    >
                      {openingInquiryId === inquiry.id ? "Loading..." : "View Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </section>

      {selectedInquiry && (
        <InquiryDetailsModal
          inquiry={selectedInquiry}
          open={Boolean(selectedInquiry)}
          onClose={() => setSelectedInquiry(null)}
          role="owner"
          error={detailsError}
          onInquiryUpdated={handleInquiryUpdated}
          onOwnerStatusChange={handleAction}
        />
      )}
    </main>
  )
}
