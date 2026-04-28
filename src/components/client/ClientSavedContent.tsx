"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabaseClient } from "@/lib/supabaseClient"
import { MapPin, Building2, ArrowUpRight, X } from "lucide-react"
import VenueDetailsModal from "@/components/common/VenueDetailsModal"
import PageSectionHeader from "@/components/common/PageSectionHeader"

type VenueDetailRow = {
  id: string
  organization_id: string | null
  organization_name: string | null
  name: string
  location: string | null
  capacity: number | null
  price: number | null
  image: string | null
  amenities: string[] | null
  rating: number | null
  review_count: number | null
  description: string | null
  additional_info: string | null
  venue_type: string | null
  is_available: boolean | null
}

type ModalVenue = {
  id: string
  organizationId: string
  name: string
  location: string
  capacity: number
  price: string
  image: string
  amenities: string[]
  rating: number
  reviewCount: number
  ownerName: string
  ownerInitials: string
  description?: string
  additionalInfo?: string
  venueType?: string
  isAvailable?: boolean
}

type SavedItem = {
  id: string
  item_id: string
  item_type: string
  name: string
  location: string
  organization_id?: string | null
}

function getSavedTypeLabel(itemType: string) {
  return itemType === "organization" ? "Organization" : "Venue"
}

export default function ClientSavedContent() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [activeVenue, setActiveVenue] = useState<ModalVenue | null>(null)
  const [venueModalOpen, setVenueModalOpen] = useState(false)
  const [openingVenueId, setOpeningVenueId] = useState<string | null>(null)

  function initialsFromName(name: string): string {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  useEffect(() => {
    let active = true

    async function loadSavedItems() {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabaseClient.auth.getSession()
      const user = session?.user
      const token = session?.access_token

      if (!user || !token) {
        if (!active) return
        setSavedItems([])
        setAccessToken(null)
        setLoading(false)
        setError("Please log in to view saved items")
        return
      }

      setAccessToken(token)

      try {
        const response = await fetch("/api/client/saved", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("Failed to load saved items")
        const data = (await response.json()) as SavedItem[]
        if (!active) return
        setSavedItems(data)
      } catch (fetchError: unknown) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load saved items")
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    void loadSavedItems()
    return () => { active = false }
  }, [])

  async function handleRemove(savedItemId: string) {
    if (!accessToken) return
    setRemovingId(savedItemId)
    try {
      const response = await fetch(
        `/api/client/saved?savedItemId=${encodeURIComponent(savedItemId)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!response.ok) throw new Error("Failed to remove saved item")
      setSavedItems((current) => current.filter((item) => item.id !== savedItemId))
    } catch (removeError: unknown) {
      setError(removeError instanceof Error ? removeError.message : "Failed to remove saved item")
    } finally {
      setRemovingId(null)
    }
  }

  async function handleOpenVenueDetails(venueId: string) {
    setOpeningVenueId(venueId)

    const { data, error: venueError } = await supabaseClient
      .from("venue_full_details")
      .select(
        "id, organization_id, organization_name, name, location, capacity, price, image, amenities, rating, review_count, description, additional_info, venue_type, is_available"
      )
      .eq("id", venueId)
      .single<VenueDetailRow>()

    setOpeningVenueId(null)

    if (venueError || !data) {
      setError("Failed to load venue details")
      return
    }

    const organizationName = data.organization_name ?? "Venue Owner"

    setActiveVenue({
      id: data.id,
      organizationId: data.organization_id ?? "",
      name: data.name,
      location: data.location ?? "",
      capacity: data.capacity ?? 0,
      price: data.price !== null ? `₱${Number(data.price).toLocaleString()}` : "Price on request",
      image: data.image ?? "/images/placeholder-venue.jpg",
      amenities: data.amenities ?? [],
      rating: Number(data.rating ?? 0),
      reviewCount: data.review_count ?? 0,
      ownerName: organizationName,
      ownerInitials: initialsFromName(organizationName) || "VO",
      description: data.description ?? undefined,
      additionalInfo: data.additional_info ?? undefined,
      venueType: data.venue_type ?? undefined,
      isAvailable: data.is_available ?? true,
    })
    setVenueModalOpen(true)
  }

  return (
    <main style={{ minHeight: "100vh", background: "#fafaf8", color: "#1a1a1a", fontFamily: "var(--font-sans, sans-serif)" }}>
      <PageSectionHeader
        eyebrow="Saved"
        title="Saved Items"
        description="Keep track of venues and organizations you want to revisit later."
        maxWidthClassName="max-w-[900px]"
        className="border-[#e8e6e0] bg-white"
      />

      {/* Content */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                style={{
                  height: 208,
                  borderRadius: 16,
                  background: "#eceae4",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        )}
        {error && !loading && (
          <p style={{ fontSize: 14, color: "#c0392b" }}>{error}</p>
        )}
        {!loading && !error && savedItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 15, color: "#9a9a9a" }}>Nothing saved yet.</p>
            <p style={{ fontSize: 13, color: "#b8b8b8", marginTop: 6 }}>Venues and organizations you save will appear here.</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {!loading && savedItems.map((item) => {
            return (
            <div
              key={item.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e8e6e0",
                borderRadius: 16,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                transition: "box-shadow 0.2s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.07)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              {/* Remove button */}
              <button
                onClick={() => { void handleRemove(item.id) }}
                disabled={removingId === item.id}
                style={{
                  position: "absolute", top: 16, right: 16,
                  width: 28, height: 28, borderRadius: "50%",
                  border: "1px solid #e8e6e0", background: "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#9a9a9a",
                  transition: "background 0.15s, color 0.15s",
                  opacity: removingId === item.id ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#fdf0f0"; e.currentTarget.style.color = "#c0392b" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9a9a9a" }}
                title="Remove"
              >
                <X size={13} />
              </button>

              {/* Type badge */}
              <div style={{ marginBottom: 14 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#1d3557", background: "#eef2f8",
                  padding: "4px 10px", borderRadius: 20,
                }}>
                  <Building2 size={11} />
                  {getSavedTypeLabel(item.item_type)}
                </span>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 500, color: "#0f1117", margin: "0 0 8px", fontFamily: "Georgia, 'Times New Roman', serif", paddingRight: 20 }}>
                {item.name}
              </h2>

              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
                <MapPin size={12} color="#9a9a9a" />
                <p style={{ fontSize: 13, color: "#9a9a9a", margin: 0 }}>{item.location}</p>
              </div>

              <div style={{ marginTop: "auto", borderTop: "1px solid #f0eee8", paddingTop: 16 }}>
                {item.item_type === "organization" ? (
                  <Link
                    href={`/organizations/${item.item_id}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontSize: 13, fontWeight: 500, color: "#1d3557",
                      textDecoration: "none",
                      background: "transparent", border: "1px solid #c8cdd8",
                      borderRadius: 24, padding: "8px 18px",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#f0f3f8"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1d3557" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "#c8cdd8" }}
                  >
                    View <ArrowUpRight size={13} />
                  </Link>
                ) : (
                  <button
                    onClick={() => { void handleOpenVenueDetails(item.item_id) }}
                    disabled={openingVenueId === item.item_id}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontSize: 13, fontWeight: 500, color: "#1d3557",
                      textDecoration: "none",
                      background: "transparent", border: "1px solid #c8cdd8",
                      borderRadius: 24, padding: "8px 18px",
                      transition: "background 0.15s, border-color 0.15s",
                      cursor: openingVenueId === item.item_id ? "not-allowed" : "pointer",
                      opacity: openingVenueId === item.item_id ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f3f8"; e.currentTarget.style.borderColor = "#1d3557" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#c8cdd8" }}
                  >
                    {openingVenueId === item.item_id ? "Loading..." : "View"} <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
            </div>
            )
          })}
        </div>
      </section>

      {activeVenue && (
        <VenueDetailsModal
          open={venueModalOpen}
          onClose={() => setVenueModalOpen(false)}
          {...activeVenue}
        />
      )}
    </main>
  )
}