"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import { supabaseClient } from "@/lib/supabaseClient"
import ClientNavBar from "@/components/navbar/ClientNavBar"
import OwnerNavBar from "@/components/navbar/OwnerNavBar"

export default function AppNavbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <ClientNavBar />
  }

  const role = user?.user_metadata?.role

  if (role === "owner") {
    return <OwnerNavBar />
  }

  return <ClientNavBar />
}