"use client"

import { useEffect, useState } from "react"
import SignUpForm from "@/components/authentication/SignUpForm"

export default function SignUpFormClientOnly() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  return <SignUpForm />
}
