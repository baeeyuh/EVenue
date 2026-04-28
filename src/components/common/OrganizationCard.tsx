import Image from "next/image"
import Link from "next/link"
import { MapPin, Building2 } from "lucide-react"
import { Card } from "@/components/ui/card"

export type OrganizationCardProps = {
  id: string
  name: string
  logo: string
  location: string
  description: string
  venueCount: number
}

export default function OrganizationCard({
  id,
  name,
  logo,
  location,
  description,
  venueCount,
}: OrganizationCardProps) {
  const imageSrc = logo

  return (
    <Link href={`/organizations/${id}`} className="block">
      <Card className="overflow-hidden rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer group p-0">

        <div className="relative w-full aspect-3/2 bg-muted">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-10 h-10 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute right-2.5 top-2.5 rounded-full bg-primary/90 px-2 py-0.5 text-[9px] font-medium text-primary-foreground sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
            {venueCount ?? 0} {(venueCount ?? 0) === 1 ? "venue" : "venues"}
          </div>
        </div>

        <div className="-mt-0.5 space-y-2 p-2.5 pt-0 sm:mt-0 sm:space-y-3 sm:p-4 sm:pt-0">
          <div>
            <h3 className="truncate font-serif text-sm font-light leading-tight text-foreground sm:text-lg">
              {name}
            </h3>
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground sm:text-[11px]">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>

          <p className="hidden text-xs leading-relaxed text-muted-foreground line-clamp-2 sm:block">
            {description}
          </p>

          <div className="flex items-center justify-between border-t border-border/60 pt-2">
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground sm:text-[11px] truncate">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">{venueCount ?? 0} {(venueCount ?? 0) === 1 ? "venue listed" : "venues listed"}</span>
            </div>
            <span className="text-[9px] font-medium text-primary sm:text-[10px] truncate">View profile</span>
          </div>
        </div>

      </Card>
    </Link>
  )
}