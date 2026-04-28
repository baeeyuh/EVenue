import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageSectionHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
  maxWidthClassName?: string
  className?: string
  containerClassName?: string
  eyebrowClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

export default function PageSectionHeader({
  eyebrow,
  title,
  description,
  actions,
  maxWidthClassName,
  className,
  containerClassName,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
}: PageSectionHeaderProps) {
  return (
    <section className={cn("border-b border-border/60 bg-background", className)}>
      <div
        className={cn(
          "mx-auto px-6 py-6",
          maxWidthClassName ?? "max-w-6xl",
          containerClassName
        )}
      >
        <p
          className={cn(
            "mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary",
            eyebrowClassName
          )}
        >
          {eyebrow}
        </p>

        {actions ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className={cn("font-serif text-4xl font-light tracking-tight", titleClassName)}>{title}</h1>
            <div className="shrink-0">{actions}</div>
          </div>
        ) : (
          <h1 className={cn("font-serif text-4xl font-light tracking-tight", titleClassName)}>{title}</h1>
        )}

        {description ? (
          <p className={cn("mt-3 max-w-2xl text-sm leading-7 text-muted-foreground", descriptionClassName)}>
            {description}
          </p>
        ) : null}
      </div>
    </section>
  )
}