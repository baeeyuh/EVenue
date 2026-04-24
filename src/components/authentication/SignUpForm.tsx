"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthTabBar from "./AuthTabBar"
import RolePicker, { type Role } from "./RolePicker"
import Link from "next/link"
import { useAuthFields } from "@/types/types"
import { signUp } from "@/lib/supabase/auth"
import { isValidEmail } from "@/lib/utils"
import { useRouter } from "next/navigation"

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function SignUpForm() {
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)

  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
  } = useAuthFields()

  const [confirmPassword, setConfirmPassword] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlightRef = useRef(false)
  const lastSubmitRef = useRef(0)

  const isOwner = role === "owner"

  async function handleCreateAccount() {
    const now = Date.now()
    if (now - lastSubmitRef.current < 1000) {
      setError("Please wait a moment before trying again")
      return
    }

    if (inFlightRef.current) return
    inFlightRef.current = true
    lastSubmitRef.current = now
    setLoading(true)
    setError(null)

    if (!role) {
      setLoading(false)
      inFlightRef.current = false
      setError("Please select a role")
      return
    }

    if (!firstName.trim()) {
      setLoading(false)
      inFlightRef.current = false
      setError("First name is required")
      return
    }

    if (!lastName.trim()) {
      setLoading(false)
      inFlightRef.current = false
      setError("Last name is required")
      return
    }

    if (!contactNumber.trim()) {
      setLoading(false)
      inFlightRef.current = false
      setError("Contact number is required")
      return
    }

    if (!email) {
      setLoading(false)
      inFlightRef.current = false
      setError("Email is required")
      return
    }

    if (!isValidEmail(email)) {
      setLoading(false)
      inFlightRef.current = false
      setError("Please enter a valid email address")
      return
    }

    if (!password || password.length < 8) {
      setLoading(false)
      inFlightRef.current = false
      setError("Password must be at least 8 characters")
      return
    }

    if (!confirmPassword) {
      setLoading(false)
      inFlightRef.current = false
      setError("Please confirm your password")
      return
    }

    if (password !== confirmPassword) {
      setLoading(false)
      inFlightRef.current = false
      setError("Passwords do not match")
      return
    }

    if (isOwner) {
      if (!businessName.trim()) {
        setLoading(false)
        inFlightRef.current = false
        setError("Business name is required")
        return
      }

      if (!businessAddress.trim()) {
        setLoading(false)
        inFlightRef.current = false
        setError("Business address is required")
        return
      }

      if (!city.trim()) {
        setLoading(false)
        inFlightRef.current = false
        setError("City / Municipality is required")
        return
      }

      if (!province.trim()) {
        setLoading(false)
        inFlightRef.current = false
        setError("Province is required")
        return
      }
    }

    try {
      const { error } = await signUp({
        email,
        password,
        firstName,
        lastName,
        contactNumber,
        role,
        businessName: isOwner ? businessName : undefined,
        businessAddress: isOwner ? businessAddress : undefined,
        city: isOwner ? city : undefined,
        province: isOwner ? province : undefined,
      })

      if (error) {
        setError(error.message ?? "Sign-up failed")
      } else {
        router.push("/authentication/login?signup=success")
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An unexpected error occurred"))
    } finally {
      setLoading(false)
      inFlightRef.current = false
    }
  }

  return (
    <div className="flex h-full flex-col justify-center space-y-4">
      <AuthTabBar active="signup" />

      <div>
        <h1 className="font-serif text-2xl font-light sm:text-3xl">Join EVenue.</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {role === "owner" ? "Create your business account below" : "Create your account below"}
        </p>
      </div>

      <RolePicker value={role} onChange={setRole} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
            First name
          </Label>
          <Input
            placeholder="Juan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-9 border-border/60 bg-muted/50 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Last name
          </Label>
          <Input
            placeholder="Dela Cruz"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-9 border-border/60 bg-muted/50 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Contact number
        </Label>
        <Input
          type="tel"
          placeholder="09XX XXX XXXX"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="h-9 border-border/60 bg-muted/50 text-sm"
        />
      </div>

      {isOwner && (
        <>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Business name
            </Label>
            <Input
              placeholder="Grand Palace Events Hall"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="h-9 border-border/60 bg-muted/50 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Business address
            </Label>
            <Input
              placeholder="Street, Barangay"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              className="h-9 border-border/60 bg-muted/50 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                City / Municipality
              </Label>
              <Input
                placeholder="Cagayan de Oro"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-9 border-border/60 bg-muted/50 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Province
              </Label>
              <Input
                placeholder="Misamis Oriental"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="h-9 border-border/60 bg-muted/50 text-sm"
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Email
        </Label>
        <Input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 border-border/60 bg-muted/50 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Password
          </Label>
          <Input
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-9 border-border/60 bg-muted/50 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Confirm password
          </Label>
          <Input
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-9 border-border/60 bg-muted/50 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        onClick={handleCreateAccount}
        disabled={
          loading ||
          !role ||
          !firstName.trim() ||
          !lastName.trim() ||
          !contactNumber.trim() ||
          !email ||
          !isValidEmail(email) ||
          !password ||
          password.length < 8 ||
          !confirmPassword ||
          password !== confirmPassword ||
          (isOwner &&
            (!businessName.trim() ||
              !businessAddress.trim() ||
              !city.trim() ||
              !province.trim()))
        }
        className="w-full rounded-full bg-primary text-white hover:bg-[#1a3148] disabled:opacity-40"
      >
        {loading ? "Creating..." : "Create Account"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/authentication/login"
          className="font-medium text-foreground underline underline-offset-2"
        >
          Log in
        </Link>
      </p>
    </div>
  )
}