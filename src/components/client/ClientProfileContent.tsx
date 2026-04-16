"use client"

import { useEffect, useState } from "react"
import { Mail, Phone, User2, ShieldCheck } from "lucide-react"

import { supabaseClient } from "@/lib/supabaseClient"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ProfileResponse = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  contact_number: string | null
  role: string | null
  created_at: string | null
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "?"
}

function formatRole(role: string) {
  if (!role) return "Not set"
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export default function ClientProfileContent() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [role, setRole] = useState("")
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
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error("Failed to load profile")

        const profile = (await response.json()) as ProfileResponse | null

        if (!active) return

        if (profile) {
          setFirstName(profile.first_name ?? "")
          setLastName(profile.last_name ?? "")
          setEmail(profile.email ?? user.email ?? "")
          setContactNumber(profile.contact_number ?? "")
          setRole(profile.role ?? "")
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
        body: JSON.stringify({ firstName, lastName, contactNumber }),
      })

      if (!response.ok) throw new Error("Failed to update profile")
      setSuccess("Profile updated successfully")
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] text-foreground">
      <section className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Account
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight">My Profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Manage your account information and keep your event planning details updated.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-4 px-6 py-10">
        {loading && <p className="text-sm text-muted-foreground">Loading profile...</p>}

        {error && !loading && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {success && !loading && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <p className="text-sm text-emerald-700">{success}</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-6">
            <Avatar className="h-16 w-16 border border-border/60">
              <AvatarFallback className="bg-primary font-serif text-lg text-primary-foreground">
                {getInitials(firstName, lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="font-serif text-xl font-light text-foreground">
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Your Name"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
            <CardDescription>
              Update your basic account details.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  First Name
                </Label>
                <div className="relative">
                  <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="h-11 rounded-xl border-border/60 bg-background pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Last Name
                </Label>
                <div className="relative">
                  <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="h-11 rounded-xl border-border/60 bg-background pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  readOnly
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10 text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Contact Number
              </Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="09XX XXX XXXX"
                  className="h-11 rounded-xl border-border/60 bg-background pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Role
              </Label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={formatRole(role)}
                  readOnly
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10 text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-border/50 pt-5">
              <Button
                onClick={() => {
                  void handleSave()
                }}
                disabled={loading || saving || !accessToken || (!firstName.trim() && !lastName.trim())}
                className="rounded-full bg-primary text-white hover:bg-primary/90"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}