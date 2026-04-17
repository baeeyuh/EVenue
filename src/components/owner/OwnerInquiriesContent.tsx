"use client"

import { useEffect, useState } from "react"

import { supabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type OwnerInquiry = {
  id: string
  message: string
  status: string | null
  created_at: string | null
  venue_id: string | null
  venue_name: string
}

function formatDate(value: string | null) {
  if (!value) return "Unknown date"
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export default function OwnerInquiriesContent() {
  const [inquiries, setInquiries] = useState<OwnerInquiry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadInquiries() {
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
    <main className="min-h-screen bg-[#fafaf8] text-foreground">
      <section className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Client Inquiries
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight">Inquiries</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Review and respond to inquiries from potential clients.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-4 px-6 py-10">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading inquiries...</p>
        ) : (
          inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="border-border/60">
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-serif text-2xl font-light">{inquiry.venue_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(inquiry.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                    {inquiry.status ?? "Pending"}
                  </span>
                  <Button variant="outline" className="rounded-full border-border/60">
                    View Inquiry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </main>
  )
}