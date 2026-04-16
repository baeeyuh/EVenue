"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/lib/supabaseClient"
import { CalendarDays, MapPin, Clock, ArrowUpRight } from "lucide-react"

type BookingItem = {
  id: string
  code: string | null
  status: string | null
  start_date: string
  end_date: string | null
  venue_name: string
}

function formatBookingDateLong(startDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(startDate))
}

function formatBookingTime(startDate: string, endDate: string | null) {
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  const start = timeFormatter.format(new Date(startDate))
  if (!endDate) return start
  const end = timeFormatter.format(new Date(endDate))
  return `${start} – ${end}`
}

function normalizeStatus(status: string | null) {
  if (!status) return "Pending"
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

function getStatusStyle(status: string | null): React.CSSProperties {
  const s = (status ?? "").toLowerCase()
  if (s === "confirmed") return { background: "#e8f5ee", color: "#1a5c35", border: "1px solid #b6dfc8" }
  if (s === "pending") return { background: "#fdf6e3", color: "#7a5c1a", border: "1px solid #f0d98a" }
  if (s === "cancelled") return { background: "#fdf0f0", color: "#8c2222", border: "1px solid #f0b8b8" }
  return { background: "#f0f1f3", color: "#3a3d45", border: "1px solid #d0d3da" }
}

export default function ClientBookingsContent() {
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadBookings() {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabaseClient.auth.getSession()
      const user = session?.user
      const accessToken = session?.access_token

      if (!user || !accessToken) {
        if (!active) return
        setBookings([])
        setLoading(false)
        setError("Please log in to view your bookings")
        return
      }

      try {
        const response = await fetch("/api/client/bookings", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!response.ok) throw new Error("Failed to load bookings")
        const data = (await response.json()) as BookingItem[]
        if (!active) return
        setBookings(data)
      } catch (fetchError: unknown) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load bookings")
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    void loadBookings()
    return () => { active = false }
  }, [])

  return (
    <main style={{ minHeight: "100vh", background: "#fafaf8", color: "#1a1a1a", fontFamily: "var(--font-sans, sans-serif)" }}>

      {/* Page Header */}
      <section style={{ borderBottom: "1px solid #e8e6e0", background: "#ffffff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 40px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1d3557", marginBottom: 10 }}>
            My Bookings
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 400, letterSpacing: "-0.02em", color: "#0f1117", margin: "0 0 12px", fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Reservations
          </h1>
          <p style={{ fontSize: 14, color: "#6b6b6b", margin: 0, maxWidth: 480, lineHeight: 1.65 }}>
            View your reservation progress, event schedule, and confirmed venue bookings.
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>

        {loading && (
          <p style={{ fontSize: 14, color: "#9a9a9a" }}>Loading bookings…</p>
        )}
        {error && !loading && (
          <p style={{ fontSize: 14, color: "#c0392b" }}>{error}</p>
        )}
        {!loading && !error && bookings.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 15, color: "#9a9a9a" }}>No bookings yet.</p>
            <p style={{ fontSize: 13, color: "#b8b8b8", marginTop: 6 }}>Once you reserve a venue, it will appear here.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {bookings.map((booking, i) => (
            <div
              key={booking.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e8e6e0",
                borderRadius: 16,
                padding: "28px 28px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                position: "relative",
                transition: "box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.07)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9a9a9a", marginBottom: 6 }}>
                    {booking.code ?? booking.id.slice(0, 8).toUpperCase()}
                  </p>
                  <h2 style={{ fontSize: 20, fontWeight: 500, color: "#0f1117", margin: 0, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    {booking.venue_name}
                  </h2>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 20, ...getStatusStyle(booking.status) }}>
                  {normalizeStatus(booking.status)}
                </span>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid #f0eee8", margin: "0 0 16px" }} />

              {/* Meta row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 28px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <CalendarDays size={13} color="#9a9a9a" />
                  <span style={{ fontSize: 13, color: "#5a5a5a" }}>{formatBookingDateLong(booking.start_date)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Clock size={13} color="#9a9a9a" />
                  <span style={{ fontSize: 13, color: "#5a5a5a" }}>{formatBookingTime(booking.start_date, booking.end_date)}</span>
                </div>
              </div>

              {/* Action */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 13, fontWeight: 500, color: "#1d3557",
                    background: "transparent", border: "1px solid #c8cdd8",
                    borderRadius: 24, padding: "8px 18px", cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f3f8"; e.currentTarget.style.borderColor = "#1d3557" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#c8cdd8" }}
                >
                  View Details <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}