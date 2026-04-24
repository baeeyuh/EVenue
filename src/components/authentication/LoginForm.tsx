"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthTabBar from "./AuthTabBar"
import Link from "next/link"
import { useAuthFields } from "@/types/types"
import { signIn } from "@/lib/supabase/auth"
import { supabaseClient } from "@/lib/supabaseClient"
import { isValidEmail } from "@/lib/utils"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

function resolveDashboardPath(role: string | null | undefined) {
  if (role === "owner") return "/dashboard/owner"
  return "/dashboard/client"
}

export default function LoginForm() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { email, setEmail, password, setPassword } = useAuthFields()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlightRef = useRef(false)
  const lastSubmitRef = useRef(0)

  useEffect(() => {
    if (searchParams.get("signup") !== "success") return

    toast.success("Account created successfully. Please log in.")
    router.replace(pathname)
  }, [searchParams, router, pathname])

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

      if (error) {
        setError(error.message ?? "Sign-in failed")
        return
      }

      const signedInUser =
        data?.user ??
        data?.session?.user ??
        (await supabaseClient.auth.getUser()).data.user

      const rawRole = signedInUser?.user_metadata?.role
      const normalizedRole = rawRole === "buyer" ? "client" : rawRole
      const destination = resolveDashboardPath(normalizedRole)

      toast.success("Logged in successfully")
      router.replace(destination)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
      inFlightRef.current = false
    }
  }

  return (
    <div className="flex h-full flex-col justify-center space-y-5 sm:space-y-6">
      <AuthTabBar active="login" />

      <div>
        <h1 className="font-serif text-2xl font-light sm:text-3xl">Welcome back.</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Log in to continue to EVenue
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Email
          </Label>
          <Input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 border-border/60 bg-muted/50 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Password
          </Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 border-border/60 bg-muted/50 text-sm"
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
        disabled={loading || !email || !password || !isValidEmail(email)}
        className="w-full rounded-full bg-primary text-white hover:bg-[#1a3148]"
      >
        {loading ? "Signing in..." : "Log In"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/authentication/signup"
          className="font-medium text-foreground underline underline-offset-2"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}