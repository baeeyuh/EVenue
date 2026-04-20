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
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-10 h-10 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-[10px] px-2.5 py-1 rounded-full font-medium">
            {venueCount ?? 0} {(venueCount ?? 0) === 1 ? "venue" : "venues"}
          </div>
        </div>

        <div className="p-4 pt-3 space-y-3">
          <div>
            <h3 className="font-serif text-lg font-light leading-tight text-foreground">
              {name}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              {location}
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />
              {venueCount ?? 0} {(venueCount ?? 0) === 1 ? "venue listed" : "venues listed"}
            </div>
            <span className="text-[10px] text-primary font-medium">View profile →</span>
          </div>
        </div>

      </Card>
    </Link>
  )
}