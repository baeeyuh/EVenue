"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthTabBar from "./AuthTabBar"
import Link from "next/link"
import { useAuthFields } from "@/types/types"
import { signIn } from "@/lib/supabase/auth"
import { isValidEmail } from "@/lib/utils"

export default function LoginForm() {
  const { email, setEmail, password, setPassword } = useAuthFields()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlightRef = useRef(false)
  const lastSubmitRef = useRef(0)

  async function handleLogin() {
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
    if (!password) {
      setLoading(false)
      inFlightRef.current = false
      setError("Password is required")
      return
    }

    try {
      const { data, error } = await signIn({ email, password })
      if (error) setError(error.message ?? "Sign-in failed")
      else console.log("Signed in:", data)
    } catch (err: any) {
      setError(err?.message ?? "An unexpected error occurred")
    } finally {
      setLoading(false)
      inFlightRef.current = false
    }
  }

  return (
    <div className="flex flex-col justify-center space-y-6 h-full">
      <AuthTabBar active="login" />

      <div>
        <h1 className="font-serif text-3xl font-light">Welcome back.</h1>
        <p className="text-xs text-muted-foreground mt-1">Log in to continue to EVenue</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Email</Label>
          <Input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-muted/50 border-border/60 h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Password</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-muted/50 border-border/60 h-10 text-sm"
          />
          <div className="text-right">
            <Link
              href="/authentication/forgot-password"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        onClick={handleLogin}
        disabled={
          loading || !email || !password || !isValidEmail(email)
        }
        className="w-full rounded-full bg-primary hover:bg-[#1a3148] text-white"
      >
        {loading ? "Signing in..." : "Log In"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/authentication/signup" className="text-foreground font-medium underline underline-offset-2">
          Sign up
        </Link>
      </p>
    </div>
  )
}