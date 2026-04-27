"use client"

import { useEffect, useRef } from "react"
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
  const switchRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const switchElement = switchRef.current
    if (!switchElement) return

    const setSwitchHeightVar = () => {
      document.documentElement.style.setProperty(
        "--explore-switch-height",
        `${switchElement.offsetHeight}px`
      )
    }

    setSwitchHeightVar()

    const resizeObserver = new ResizeObserver(setSwitchHeightVar)
    resizeObserver.observe(switchElement)
    window.addEventListener("resize", setSwitchHeightVar)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", setSwitchHeightVar)
    }
  }, [])

  return (
    <div
      ref={switchRef}
      className="no-scrollbar flex items-center gap-1.5 overflow-x-auto whitespace-nowrap sm:gap-2"
    >
      <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px] sm:tracking-[0.24em]">
        Explore
      </span>

      <Link
        href="/explore?type=venues"
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs transition-all sm:gap-1.5 sm:px-4 sm:py-1.5 sm:text-sm",
          activeType === "venues"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-foreground hover:bg-muted"
        )}
      >
        <MapPinned className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        <span className="font-serif">Venues</span>
      </Link>

      <Link
        href="/explore?type=organizations"
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs transition-all sm:gap-1.5 sm:px-4 sm:py-1.5 sm:text-sm",
          activeType === "organizations"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-foreground hover:bg-muted"
        )}
      >
        <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        <span className="font-serif">Organizations</span>
      </Link>
    </div>
  )
}