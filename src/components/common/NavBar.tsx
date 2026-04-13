"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { User, MessageSquare, Heart, CalendarCheck, LogOut, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { supabaseClient } from "@/lib/supabaseClient"
import { signOut } from "@/lib/supabase/auth"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const dashboardTabs = [
  { id: "inquiries", label: "Inquiries", icon: MessageSquare },
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
  { id: "saved", label: "Saved", icon: Heart },
  { id: "profile", label: "Profile", icon: User },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  const isOnDashboard = pathname.startsWith("/dashboard/customer")

  useEffect(() => {
    // Get initial session
    supabaseClient.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  const firstName = user?.user_metadata?.first_name ?? user?.email?.split("@")[0] ?? "User"
  const lastName = user?.user_metadata?.last_name ?? ""
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
  const role = user?.user_metadata?.role ?? "customer"

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/images/logo1.png"
            alt="EVenue logo"
            width={160}
            height={160}
            className="object-contain"
            style={{ width: "auto", height: "2.5rem" }}
          />
        </Link>

        {/* Center nav */}
        {isOnDashboard ? (
          <nav className="hidden md:flex items-center gap-1">
            {dashboardTabs.map(({ id, label, icon: Icon }) => {
              const isActive = pathname.endsWith(id)
              return (
                <Link
                  key={id}
                  href={`/dashboard/customer/${id}`}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-full transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              )
            })}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-1">
            <Button asChild variant="ghost" className="rounded-full px-5 text-sm">
              <Link href="/venues">Venues</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-full px-5 text-sm">
              <Link href="/organizations">Organizations</Link>
            </Button>
          </nav>
        )}

        {/* Right — auth */}
        {loading ? (
          <div className="w-24 h-8 rounded-full bg-muted animate-pulse" />
        ) : user ? (
          <div className="flex items-center gap-2">
            {!isOnDashboard && (
              <Button asChild variant="ghost" className="rounded-full px-4 text-sm hidden md:flex">
                <Link href="/dashboard/customer/inquiries">Dashboard</Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 hover:bg-muted transition-colors">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-medium">
                    {initials || "U"}
                  </div>
                  <span className="hidden md:block text-sm font-medium">{firstName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{firstName} {lastName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/customer/inquiries" className="cursor-pointer">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/customer/profile" className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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