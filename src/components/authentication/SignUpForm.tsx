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

export default function SignUpForm() {
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const { firstName, setFirstName, lastName, setLastName, email, setEmail, password, setPassword } =
    useAuthFields()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlightRef = useRef(false)
  const lastSubmitRef = useRef(0)

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
    if (!firstName || !firstName.trim()) {
      setLoading(false)
      inFlightRef.current = false
      setError("First name is required")
      return
    }
    if (!lastName || !lastName.trim()) {
      setLoading(false)
      inFlightRef.current = false
      setError("Last name is required")
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

    try {
      const { data, error } = await signUp({ email, password, firstName, lastName })
      if (error) setError(error.message ?? "Sign-up failed")
      else {
        console.log("Sign up created:", data)
        router.push("/authentication/login?signup=success")
      }
    } catch (err: any) {
      setError(err?.message ?? "An unexpected error occurred")
    } finally {
      setLoading(false)
      inFlightRef.current = false
    }
  }

  return (
    <div className="flex flex-col justify-center space-y-4 h-full">
      <AuthTabBar active="signup" />

      <div>
        <h1 className="font-serif text-3xl font-light">Join EVenue.</h1>
        <p className="text-xs text-muted-foreground mt-1">Create your account below</p>
      </div>

      <RolePicker value={role} onChange={setRole} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">First name</Label>
          <Input
            placeholder="Juan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="bg-muted/50 border-border/60 h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Last name</Label>
          <Input
            placeholder="dela Cruz"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="bg-muted/50 border-border/60 h-9 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">business name</Label>
          <Input
            placeholder="Grand Palace Events Hall"
            className="bg-muted/50 border-border/60 h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Contact number</Label>
          <Input
            type="tel"
            placeholder="09XX XXX XXXX"
            className="bg-muted/50 border-border/60 h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Business address</Label>
        <Input
          placeholder="Street, Barangay"
          className="bg-muted/50 border-border/60 h-9 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">City / Municipality</Label>
          <Input
            placeholder="Cagayan de Oro"
            className="bg-muted/50 border-border/60 h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Province</Label>
          <Input
            placeholder="Misamis Oriental"
            className="bg-muted/50 border-border/60 h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Email</Label>
        <Input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-muted/50 border-border/60 h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Password</Label>
        <Input
          type="password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-muted/50 border-border/60 h-9 text-sm"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        onClick={handleCreateAccount}
        disabled={
          loading || !role || !firstName || !lastName || !email || !isValidEmail(email) || !password || password.length < 8
        }
        className="w-full rounded-full bg-primary hover:bg-[#1a3148] text-white disabled:opacity-40"
      >
        {loading ? "Creating..." : "Create Account"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/authentication/login" className="text-foreground font-medium underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  )
}