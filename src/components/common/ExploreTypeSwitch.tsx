"use client"

import Link from "next/link"
import { Building2, MapPinned } from "lucide-react"
import { cn } from "@/lib/utils"

type ExploreType = "venues" | "organizations"

type ExploreTypeSwitchProps = {
  activeType: ExploreType
}

export default function ExploreTypeSwitch({
  activeType,
}: ExploreTypeSwitchProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        Explore
      </span>

      <Link
        href="/explore?type=venues"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-all",
          activeType === "venues"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-foreground hover:bg-muted"
        )}
      >
        <MapPinned className="h-3.5 w-3.5" />
        <span className="font-serif">Venues</span>
      </Link>

      <Link
        href="/explore?type=organizations"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-all",
          activeType === "organizations"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-foreground hover:bg-muted"
        )}
      >
        <Building2 className="h-3.5 w-3.5" />
        <span className="font-serif">Organizations</span>
      </Link>
    </div>
  )
}