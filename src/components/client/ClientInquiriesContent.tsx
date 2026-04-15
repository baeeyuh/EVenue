"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/lib/supabaseClient"

type InquiryItem = {
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
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

export default function ClientInquiriesContent() {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setLoading(false)
        setError("Please log in to view your inquiries")
        return
      }

      try {
        const response = await fetch("/api/client/inquiries", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to load inquiries")
        }

        const data = (await response.json()) as InquiryItem[]
        if (!active) return
        setInquiries(data)
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-primary">My Inquiries</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Inquiries</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Track venue questions, availability requests, and communication status.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading inquiries...</p>
        )}

        {error && !loading && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && inquiries.length === 0 && (
          <p className="text-sm text-muted-foreground">You have no inquiries yet.</p>
        )}

        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {inquiry.id.toUpperCase()}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{inquiry.venue_name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{inquiry.message}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Inquiry Date: {formatInquiryDate(inquiry.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{inquiry.status ?? "Pending"}</Badge>
                  <Button variant="outline" className="rounded-full">
                    View Inquiry
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
