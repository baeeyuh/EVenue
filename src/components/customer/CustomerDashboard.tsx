"use client"
import { useState } from "react"
import { User, MessageSquare, Heart, CalendarCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import CustomerInquiries from "@/components/customer/CustomerInquiries"
import CustomerBookings from "@/components/customer/CustomerBookings"
import CustomerSavedVenues from "@/components/customer/CustomerSavedVenues"
import CustomerProfile from "@/components/customer/CustomerProfile"

const tabs = [
  { id: "inquiries", label: "Inquiries", icon: MessageSquare },
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
  { id: "saved", label: "Saved Venues", icon: Heart },
  { id: "profile", label: "Profile", icon: User },
]

export default function CustomerDashboard() {
  const [active, setActive] = useState("inquiries")

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Dashboard</p>
          <h1 className="font-serif text-3xl font-light mt-1">Welcome back, Juan</h1>
        </div>

        {/* Tabs — scrollable on mobile */}
        <div className="border-b border-border/60 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-all whitespace-nowrap",
                  active === id
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div>
          {active === "inquiries" && <CustomerInquiries />}
          {active === "bookings" && <CustomerBookings />}
          {active === "saved" && <CustomerSavedVenues />}
          {active === "profile" && <CustomerProfile />}
        </div>

      </div>
    </div>
  )
}