"use client"

import { useEffect, useState } from "react"
import SignUpForm from "@/components/authentication/SignUpForm"

export default function SignUpFormClientOnly() {
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

  return <SignUpForm />
}
