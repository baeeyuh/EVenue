"use client"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

type StarRatingProps = {
  rating: number
  reviewCount?: number
  size?: "sm" | "md"
}


export function StarRating({ rating = 0, reviewCount, size = "md" }: StarRatingProps) {  const starSize = size === "sm" ? "w-3 h-3" : "w-4 h-4"

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(starSize, "shrink-0")}
            fill={i <= Math.round(rating) ? "#f59e0b" : "transparent"}
            stroke={i <= Math.round(rating) ? "#f59e0b" : "#d1d5db"}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <span className={cn("font-medium text-foreground", size === "sm" ? "text-xs" : "text-sm")}>
        {rating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className={cn("text-muted-foreground", size === "sm" ? "text-[11px]" : "text-xs")}>
          ({reviewCount} reviews)
        </span>
      )}
    </div>
  )
}