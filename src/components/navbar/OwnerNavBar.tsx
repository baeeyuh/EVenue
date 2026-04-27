"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  Home,
  Compass,
  Building2,
  MessageSquare,
  CalendarCheck,
  Bell,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/lib/supabaseClient"
import BaseNavBar, { type NavItem } from "@/components/navbar/BaseNavBar"
import { useBookingNotifications } from "@/hooks/useBookingNotifications"

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
  const { dueCount } = useBookingNotifications("owner", Boolean(user))

  const authenticatedNavItems: NavItem[] = [
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
      badgeCount: dueCount,
    },
    {
      href: "/dashboard/owner/notifications",
      label: "Alerts",
      icon: Bell,
      isActive: pathname.startsWith("/dashboard/owner/notifications"),
      badgeCount: dueCount,
    },
  ]

  const publicNavItems: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: "/explore",
      label: "Explore",
      icon: Compass,
      isActive: pathname.startsWith("/explore"),
    },
  ]

  const navItems = user ? authenticatedNavItems : publicNavItems

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