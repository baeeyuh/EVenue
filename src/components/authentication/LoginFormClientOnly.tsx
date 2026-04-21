"use client"

import { useEffect, useState } from "react"
import LoginForm from "@/components/authentication/LoginForm"

export default function LoginFormClientOnly() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  return <LoginForm />
}
