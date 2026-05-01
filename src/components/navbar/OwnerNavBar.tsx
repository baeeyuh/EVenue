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
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/lib/supabaseClient"
import BaseNavBar, { type NavItem } from "@/components/navbar/BaseNavBar"

type NotificationCounts = {
  inquiries: number
  bookings: number
}

export default function OwnerNavBar() {
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    inquiries: 0,
    bookings: 0,
  })

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      if (!data.session?.user) {
        setNotificationCounts({ inquiries: 0, bookings: 0 })
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setNotificationCounts({ inquiries: 0, bookings: 0 })
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    let active = true

    async function loadNotificationCounts() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken) return

      try {
        const response = await fetch("/api/owner/notification-counts", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) return

        const counts = (await response.json()) as NotificationCounts
        if (!active) return

        setNotificationCounts({
          inquiries: counts.inquiries ?? 0,
          bookings: counts.bookings ?? 0,
        })
      } catch {
        if (active) {
          setNotificationCounts({ inquiries: 0, bookings: 0 })
        }
      }
    }

    void loadNotificationCounts()

    const intervalId = window.setInterval(() => {
      void loadNotificationCounts()
    }, 30000)

    window.addEventListener("focus", loadNotificationCounts)

    return () => {
      active = false
      window.clearInterval(intervalId)
      window.removeEventListener("focus", loadNotificationCounts)
    }
  }, [pathname, user])

  const homeHref = user ? "/dashboard/owner" : "/"

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
      badgeCount: notificationCounts.inquiries,
    },
    {
      href: "/dashboard/owner/bookings",
      label: "Bookings",
      icon: CalendarCheck,
      isActive: pathname.startsWith("/dashboard/owner/bookings"),
      badgeCount: notificationCounts.bookings,
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
