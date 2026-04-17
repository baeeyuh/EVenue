"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  Home,
  LayoutDashboard,
  Building2,
  MessageSquare,
  CalendarCheck,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/lib/supabaseClient"
import BaseNavBar, { type NavItem } from "@/components/navbar/BaseNavBar"

export default function OwnerNavBar() {
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

  const homeHref = user ? "/dashboard/owner" : "/"

  const navItems: NavItem[] = [
    {
      href: homeHref,
      label: "Home",
      icon: Home,
      isActive: pathname === "/" || pathname === "/dashboard/owner",
    },
    {
      href: "/dashboard/owner/venues",
      label: "Venues",
      icon: Building2,
      isActive: pathname.startsWith("/dashboard/owner/venues"),
    },
    {
      href: "/dashboard/owner/inquiries",
      label: "Inquiries",
      icon: MessageSquare,
      isActive: pathname.startsWith("/dashboard/owner/inquiries"),
    },
    {
      href: "/dashboard/owner/bookings",
      label: "Bookings",
      icon: CalendarCheck,
      isActive: pathname.startsWith("/dashboard/owner/bookings"),
    },
  ]

  return (
    <BaseNavBar
      user={user}
      loading={loading}
      homeHref={homeHref}
      navItems={navItems}
      profileHref="/dashboard/owner/profile"
      roleLabel="owner"
      authActions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-full px-4 text-sm">
            <Link href="/authentication/login">Log In</Link>
          </Button>
          <Button asChild className="rounded-full px-4 text-sm">
            <Link href="/authentication/signup">Sign Up</Link>
          </Button>
        </div>
      }
    />
  )
}