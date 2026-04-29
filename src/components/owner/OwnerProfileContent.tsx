"use client"

import { useEffect, useState } from "react"
import { Building2, Mail, MapPin, Phone, ShieldCheck, User2 } from "lucide-react"

import { supabaseClient } from "@/lib/supabaseClient"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageSectionHeader from "@/components/common/PageSectionHeader"

type OwnerProfile = {
  id: string
  first_name: string | null
  last_name: string | null
  business_name?: string | null
  business_address?: string | null
  city?: string | null
  province?: string | null
  email: string | null
  contact_number: string | null
  role: string | null
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "?"
}

function formatRole(role: string | null) {
  if (!role) return "Owner"
  if (role === "buyer") return "Client"
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function getMetadataString(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key]
  return typeof value === "string" ? value : ""
}

export default function OwnerProfileContent() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<OwnerProfile | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      const accessToken = session?.access_token
      const user = session?.user

      if (!user || !accessToken) {
        if (!active) return
        setLoading(false)
        setError("Please log in to view your profile")
        return
      }

      setAccessToken(accessToken)
      setEmail(user.email ?? "")

      try {
        const response = await fetch("/api/owner/profile", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch owner profile")
        }

        if (!active) return

        const ownerProfile = data as OwnerProfile | null
        setProfile(ownerProfile)

        if (ownerProfile) {
          const metadata = user.user_metadata
          setFirstName(ownerProfile.first_name ?? "")
          setLastName(ownerProfile.last_name ?? "")
          setEmail(ownerProfile.email ?? user.email ?? "")
          setContactNumber(ownerProfile.contact_number ?? "")
          setRole(ownerProfile.role ?? null)
          setBusinessName(ownerProfile.business_name ?? getMetadataString(metadata, "business_name"))
          setBusinessAddress(ownerProfile.business_address ?? getMetadataString(metadata, "business_address"))
          setCity(ownerProfile.city ?? getMetadataString(metadata, "city"))
          setProvince(ownerProfile.province ?? getMetadataString(metadata, "province"))
        }
      } catch (fetchError: unknown) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch owner profile")
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
      const response = await fetch("/api/owner/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          contactNumber,
          businessName,
          businessAddress,
          city,
          province,
        }),
      })

      const updated = (await response.json()) as OwnerProfile | null

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      await supabaseClient.auth.updateUser({
        data: {
          business_name: businessName.trim() || null,
          business_address: businessAddress.trim() || null,
          city: city.trim() || null,
          province: province.trim() || null,
        },
      })

      if (updated) {
        setProfile(updated)
        setFirstName(updated.first_name ?? "")
        setLastName(updated.last_name ?? "")
        setEmail(updated.email ?? email)
        setContactNumber(updated.contact_number ?? "")
        setRole(updated.role ?? null)
        setBusinessName(updated.business_name ?? businessName)
        setBusinessAddress(updated.business_address ?? businessAddress)
        setCity(updated.city ?? city)
        setProvince(updated.province ?? province)
      }

      setSuccess("Profile updated successfully")
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] text-foreground">
      <PageSectionHeader
        eyebrow="Account"
        title="Owner Profile"
        description="Manage your owner account and contact details."
        maxWidthClassName="max-w-3xl"
      />

      <section className="mx-auto max-w-3xl space-y-4 px-6 py-10">
        {loading && (
          <>
            <Card className="h-24 animate-pulse border-border/60 bg-muted" />
            <Card className="h-72 animate-pulse border-border/60 bg-muted" />
          </>
        )}

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

        {!loading && !error && !profile && (
          <Card className="border-border/60">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                No owner profile record was found for this account.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && profile && (
          <>
            <Card className="border-border/60">
              <CardContent className="flex items-center gap-4 p-6">
                <Avatar className="h-16 w-16 border border-border/60">
                  <AvatarFallback className="bg-primary font-serif text-lg text-primary-foreground">
                    {getInitials(firstName, lastName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="font-serif text-xl font-light">
                    {`${firstName} ${lastName}`.trim() || "Owner"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{email}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Account Information</CardTitle>
                <CardDescription>Owner account details.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
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
                    Business Name
                  </Label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your business or organization name"
                      className="h-11 rounded-xl border-border/60 bg-background pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Business Address
                  </Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Street, Barangay"
                      className="h-11 rounded-xl border-border/60 bg-background pl-10"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      City / Municipality
                    </Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Cagayan de Oro"
                        className="h-11 rounded-xl border-border/60 bg-background pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Province
                    </Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="Misamis Oriental"
                        className="h-11 rounded-xl border-border/60 bg-background pl-10"
                      />
                    </div>
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
          </>
        )}
      </section>
    </main>
  )
}
