import {
  Phone, Mail, Globe, Camera,
  Users, Clock, Sparkles, MapPin,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Organization } from "@/lib/types"

export default function OrganizationAbout({ org }: { org: Organization & {
  phone?: string
  email?: string
  website?: string
  instagram?: string
  facebook?: string
  specializations?: string[]
  openingHours?: string
  gallery?: string[]
} }) {
  return (
    <div className="space-y-6 sticky top-24">

      {/* About */}
      <div className="rounded-2xl border border-border/60 p-5 space-y-3">
        <h3 className="font-serif text-lg font-light">About</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{org.description}</p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {org.openingHours}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {org.location}
        </div>
      </div>

      {/* Specializations */}
      <div className="rounded-2xl border border-border/60 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="font-serif text-lg font-light">Specializes In</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {org.specializations?.map((s: string) => (
            <Badge key={s} variant="secondary" className="rounded-full text-xs font-normal">
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-2xl border border-border/60 p-5 space-y-3">
        <h3 className="font-serif text-lg font-light">Contact</h3>
        <div className="space-y-2.5">
          {(
            [
              { icon: Phone, label: org.phone, href: org.phone ? `tel:${org.phone}` : undefined },
              { icon: Mail, label: org.email, href: org.email ? `mailto:${org.email}` : undefined },
              {
                icon: Globe,
                label: org.website,
                href: org.website
                  ? org.website.startsWith("http")
                    ? org.website
                    : `https://${org.website}`
                  : undefined,
              },
              {
                icon: Camera,
                label: org.instagram,
                href: org.instagram
                  ? `https://instagram.com/${org.instagram.replace("@", "")}`
                  : undefined,
              },
              { icon: Users, label: org.facebook, href: org.facebook ? `https://facebook.com/${org.facebook}` : undefined },
            ]
          )
            .filter((c) => c.label)
            .map(({ icon: Icon, label, href }) => (
              <a
                key={String(label)}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
              >
                <Icon className="w-3.5 h-3.5 shrink-0 group-hover:text-primary transition-colors" />
                <span className="truncate">{label}</span>
              </a>
            ))}
        </div>
      </div>

      {/* Inquiry CTA */}
      <Button className="w-full rounded-full bg-primary hover:bg-primary/90">
        Send Inquiry
      </Button>

    </div>
  )
}