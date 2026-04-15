"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"

type ProfileResponse = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: string | null
  created_at: string | null
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "?"
}

export default function ClientProfileContent() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState("buyer")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const { data: { session } } = await supabaseClient.auth.getSession()
      const user = session?.user
      const token = session?.access_token

      if (!user || !token) {
        if (!active) return
        setLoading(false)
        setError("Please log in to view your profile")
        return
      }

      setAccessToken(token)
      setEmail(user.email ?? "")

      try {
        const response = await fetch("/api/client/profile", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("Failed to load profile")
        const profile = (await response.json()) as ProfileResponse | null
        if (!active) return
        if (profile) {
          setFirstName(profile.first_name ?? "")
          setLastName(profile.last_name ?? "")
          setEmail(profile.email ?? user.email ?? "")
          setRole(profile.role ?? "buyer")
        }
      } catch (fetchError: unknown) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load profile")
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    void loadProfile()
    return () => { active = false }
  }, [])

  async function handleSave() {
    if (!accessToken) return
    if (!firstName.trim() && !lastName.trim()) {
      setError("At least one name field is required")
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ firstName, lastName }),
      })
      if (!response.ok) throw new Error("Failed to update profile")
      setSuccess("Profile updated successfully")
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    color: "#0f1117",
    background: "#ffffff",
    border: "1px solid #e2e0da",
    borderRadius: 10,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    fontFamily: "var(--font-sans, sans-serif)",
  }

  const readonlyInputStyle: React.CSSProperties = {
    ...inputStyle,
    background: "#f7f6f3",
    color: "#9a9a9a",
    cursor: "default",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#9a9a9a",
    marginBottom: 7,
  }

  return (
    <main style={{ minHeight: "100vh", background: "#fafaf8", color: "#1a1a1a", fontFamily: "var(--font-sans, sans-serif)" }}>

      {/* Page Header */}
      <section style={{ borderBottom: "1px solid #e8e6e0", background: "#ffffff" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px 40px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1d3557", marginBottom: 10 }}>
            Account
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 400, letterSpacing: "-0.02em", color: "#0f1117", margin: "0 0 12px", fontFamily: "Georgia, 'Times New Roman', serif" }}>
            My Profile
          </h1>
          <p style={{ fontSize: 14, color: "#6b6b6b", margin: 0, maxWidth: 480, lineHeight: 1.65 }}>
            Manage your account information and keep your event planning details updated.
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px" }}>

        {loading && (
          <p style={{ fontSize: 14, color: "#9a9a9a", marginBottom: 24 }}>Loading profile…</p>
        )}
        {error && !loading && (
          <div style={{ background: "#fdf0f0", border: "1px solid #f0b8b8", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "#8c2222", margin: 0 }}>{error}</p>
          </div>
        )}
        {success && !loading && (
          <div style={{ background: "#e8f5ee", border: "1px solid #b6dfc8", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "#1a5c35", margin: 0 }}>{success}</p>
          </div>
        )}

        {/* Avatar + name card */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e8e6e0",
          borderRadius: 16,
          padding: "28px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "#1d3557",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 600, color: "#ffffff",
            flexShrink: 0,
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}>
            {getInitials(firstName, lastName)}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 500, color: "#0f1117", margin: "0 0 4px", fontFamily: "Georgia, 'Times New Roman', serif" }}>
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Your Name"}
            </p>
            <p style={{ fontSize: 13, color: "#9a9a9a", margin: 0 }}>{email}</p>
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e8e6e0",
          borderRadius: 16,
          padding: "28px",
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0f1117", margin: "0 0 24px", letterSpacing: "-0.01em" }}>
            Personal Information
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                style={inputStyle}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1d3557" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e0da" }}
                placeholder="First name"
              />
            </div>

            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                style={inputStyle}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1d3557" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e0da" }}
                placeholder="Last name"
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Email Address</label>
              <input style={readonlyInputStyle} type="email" value={email} readOnly />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Role</label>
              <input style={readonlyInputStyle} value={role} readOnly />
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid #f0eee8", marginTop: 28, paddingTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => { void handleSave() }}
              disabled={loading || saving || !accessToken || (!firstName.trim() && !lastName.trim())}
              style={{
                fontSize: 13, fontWeight: 500,
                color: "#ffffff",
                background: loading || saving || !accessToken || (!firstName.trim() && !lastName.trim()) ? "#a0aab8" : "#1d3557",
                border: "none",
                borderRadius: 24, padding: "10px 24px",
                cursor: loading || saving || !accessToken || (!firstName.trim() && !lastName.trim()) ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (!loading && !saving) e.currentTarget.style.background = "#16294a" }}
              onMouseLeave={(e) => { if (!loading && !saving) e.currentTarget.style.background = "#1d3557" }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}