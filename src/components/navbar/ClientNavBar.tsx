"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  Home,
  Compass,
  MessageSquare,
  CalendarCheck,
  Heart,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/lib/supabaseClient"
import BaseNavBar, { type NavItem } from "@/components/navbar/BaseNavBar"

type NotificationCounts = {
  inquiries: number
  bookings: number
}

export default function ClientNavBar() {
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
        const response = await fetch("/api/client/notification-counts", {
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

  const homeHref = user ? "/dashboard/client" : "/"

  const authenticatedNavItems: NavItem[] = [
    {
      href: homeHref,
      label: "Home",
      icon: Home,
      isActive: pathname === "/" || pathname === "/dashboard/client",
    },
    {
      href: "/explore",
      label: "Explore",
      icon: Compass,
      isActive: pathname.startsWith("/explore"),
    },
    {
      href: "/dashboard/client/inquiries",
      label: "Inquiries",
      icon: MessageSquare,
      isActive: pathname.startsWith("/dashboard/client/inquiries"),
      badgeCount: notificationCounts.inquiries,
    },
    {
      href: "/dashboard/client/bookings",
      label: "Bookings",
      icon: CalendarCheck,
      isActive: pathname.startsWith("/dashboard/client/bookings"),
      badgeCount: notificationCounts.bookings,
    },
    {
      href: "/dashboard/client/saved",
      label: "Saved",
      icon: Heart,
      isActive: pathname.startsWith("/dashboard/client/saved"),
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
      profileHref="/dashboard/client/profile"
      roleLabel="client"
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
