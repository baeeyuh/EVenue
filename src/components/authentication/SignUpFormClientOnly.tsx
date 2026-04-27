"use client"

import { useSyncExternalStore } from "react"
import SignUpForm from "@/components/authentication/SignUpForm"

export default function SignUpFormClientOnly() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  return <SignUpForm />
}
