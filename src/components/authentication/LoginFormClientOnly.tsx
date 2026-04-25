"use client"

import { useEffect, useState } from "react"
import LoginForm from "@/components/authentication/LoginForm"

export default function LoginFormClientOnly() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
      </div>
    )
  }

  return <LoginForm />
}
