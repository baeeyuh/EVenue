"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Home,
  Compass,
  MessageSquare,
  CalendarCheck,
  Heart,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/lib/supabaseClient"
import { signOut } from "@/lib/supabase/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const publicTabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
]

const customerTabs = [
  { href: "/dashboard/customer/inquiries", label: "Inquiries", icon: MessageSquare },
  { href: "/dashboard/customer/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/customer/saved", label: "Saved", icon: Heart },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()

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

  async function handleSignOut() {
    await signOut()
    router.replace("/")
    router.refresh()
  }

  const firstName = user?.user_metadata?.first_name ?? user?.email?.split("@")[0] ?? "User"
  const lastName = user?.user_metadata?.last_name ?? ""
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()

  const homeHref = user ? "/dashboard/customer" : "/"

  const isHomeActive = pathname === "/" || pathname === "/dashboard/customer"
  const isExploreActive = pathname.startsWith("/explore")

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href={homeHref} className="shrink-0">
          <Image
            src="/images/logo1.png"
            alt="EVenue logo"
            width={160}
            height={160}
            className="object-contain"
            style={{ width: "auto", height: "2.5rem" }}
          />
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {publicTabs.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/"
                ? isHomeActive
                : isExploreActive

            const actualHref = href === "/" ? homeHref : href

            return (
              <Link
                key={label}
                href={actualHref}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-[12px] whitespace-nowrap transition-all font-serif",
                  isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}

          {user && (
            <>
              <div className="mx-1 h-5 w-px bg-border/60" />
              {customerTabs.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`)

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-[12px] whitespace-nowrap transition-all font-serif",
                      isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 transition-colors hover:bg-muted">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {initials || "U"}
                </div>
                <span className="hidden text-sm font-serif font-medium md:block">{firstName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48 rounded-2xl">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">
                  {firstName} {lastName}
                </p>
                <p className="text-xs capitalize text-muted-foreground">customer</p>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/dashboard/customer/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-full px-5 text-sm">
              <Link href="/authentication/login">Log In</Link>
            </Button>
            <Button asChild className="rounded-full px-5 text-sm">
              <Link href="/authentication/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}