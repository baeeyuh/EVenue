"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabaseClient } from "@/lib/supabaseClient"

type ProfileResponse = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: string | null
  created_at: string | null
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

      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to load profile")
        }

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

    return () => {
      active = false
    }
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      setSuccess("Profile updated successfully")
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-primary">Profile</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">My Profile</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Manage your account information and keep your event planning details updated.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <p className="mb-4 text-sm text-muted-foreground">Loading profile...</p>
        )}

        {error && !loading && (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        )}

        {success && !loading && (
          <p className="mb-4 text-sm text-primary">{success}</p>
        )}

        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} readOnly />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={role} readOnly />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button className="rounded-full px-6" onClick={() => void handleSave()} disabled={loading || saving || !accessToken || (!firstName.trim() && !lastName.trim())}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
