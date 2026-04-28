"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ChevronDown, LogOut, User } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import { signOut } from "@/lib/supabase/auth"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  isActive: boolean
}

type BaseNavBarProps = {
  user: SupabaseUser | null
  loading: boolean
  homeHref: string
  navItems: NavItem[]
  profileHref: string
  roleLabel: string
  authActions?: React.ReactNode
}

export default function BaseNavBar({
  user,
  loading,
  homeHref,
  navItems,
  profileHref,
  roleLabel,
  authActions,
}: BaseNavBarProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const headerRef = useRef<HTMLElement | null>(null)
  const bottomNavRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const header = headerRef.current
    const bottomNav = bottomNavRef.current
    if (!header) return

    const setNavbarHeightVar = () => {
      const headerHeight = `${header.offsetHeight}px`
      const bottomNavHeight = `${bottomNav?.offsetHeight ?? 0}px`
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches

      document.documentElement.style.setProperty(
        "--app-navbar-height",
        headerHeight
      )
      document.documentElement.style.setProperty(
        "--app-navbar-bottom-height",
        isDesktop ? "0px" : `calc(${bottomNavHeight} + env(safe-area-inset-bottom, 0px))`
      )
    }

    setNavbarHeightVar()

    const resizeObserver = new ResizeObserver(setNavbarHeightVar)
    resizeObserver.observe(header)
    if (bottomNav) {
      resizeObserver.observe(bottomNav)
    }
    window.addEventListener("resize", setNavbarHeightVar)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", setNavbarHeightVar)
      document.documentElement.style.setProperty("--app-navbar-height", "0px")
      document.documentElement.style.setProperty("--app-navbar-bottom-height", "0px")
    }
  }, [])

  async function handleSignOut() {
    if (isSigningOut) return

    setIsSigningOut(true)
    const { error } = await signOut()

    if (error) {
      setIsSigningOut(false)
      return
    }

    window.location.assign("/")
  }

  const firstName = user?.user_metadata?.first_name ?? user?.email?.split("@")[0] ?? "User"
  const lastName = user?.user_metadata?.last_name ?? ""
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 py-2.5 sm:py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            {/* Top row on mobile / Left on desktop */}
            <div className="flex items-center justify-between lg:flex-none">
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

              <div className="lg:hidden">
                {loading ? (
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                ) : user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 rounded-full px-1 py-1 transition-colors hover:bg-muted/60">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                          {initials || "U"}
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium">
                          {firstName} {lastName}
                        </p>
                        <p className="text-xs capitalize text-muted-foreground">{roleLabel}</p>
                      </div>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem asChild>
                        <Link href={profileHref} className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="cursor-pointer text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {isSigningOut ? "Logging Out..." : "Log Out"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  authActions
                )}
              </div>
            </div>

            {/* Middle nav */}
            <nav className="hidden lg:flex w-full items-center justify-center gap-x-8">
              {navItems.map(({ href, label, icon: Icon, isActive }) => (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  title={label}
                  className={cn(
                    "flex min-h-10 items-center justify-center rounded-full px-2 py-2 text-[11px] transition-colors sm:min-h-0 sm:gap-1.5 sm:px-0 sm:py-0 sm:text-[13px] lg:text-sm",
                    isActive
                      ? "bg-primary/10 text-primary sm:bg-transparent"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground sm:hover:bg-transparent"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 sm:h-4 sm:w-4 lg:h-4.5 lg:w-4.5" />
                  <span className="hidden font-serif leading-none sm:inline">{label}</span>
                </Link>
              ))}
            </nav>

            {/* Right user on desktop */}
            <div className="hidden lg:flex lg:flex-none lg:items-center">
              {loading ? (
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full px-1 py-1 transition-colors hover:bg-muted/60">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {initials || "U"}
                      </div>
                      <span className="text-sm font-serif font-medium">{firstName}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">
                        {firstName} {lastName}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">{roleLabel}</p>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href={profileHref} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="cursor-pointer text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {isSigningOut ? "Logging Out..." : "Log Out"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                authActions
              )}
            </div>
          </div>
        </div>
      </header>

      <nav
        ref={bottomNavRef}
        className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden"
      >
        <div className="grid grid-flow-col auto-cols-fr items-center pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
          {navItems.map(({ href, label, icon: Icon, isActive }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={cn(
                "flex flex-col items-center justify-center text-[11px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}