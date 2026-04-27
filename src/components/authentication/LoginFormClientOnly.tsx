"use client"

import { useSyncExternalStore } from "react"
import LoginForm from "@/components/authentication/LoginForm"

export default function LoginFormClientOnly() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  return <LoginForm />
}
