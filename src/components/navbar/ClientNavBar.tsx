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

export default function ClientNavBar() {
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
    },
    {
      href: "/dashboard/client/bookings",
      label: "Bookings",
      icon: CalendarCheck,
      isActive: pathname.startsWith("/dashboard/client/bookings"),
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