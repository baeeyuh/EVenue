import {
  Phone, Mail, Globe, Camera,
  Users, Clock, Sparkles, MapPin,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Organization } from "@/lib/types"

type OrganizationSocial = {
  platform: string
  url: string
}

export default function OrganizationAbout({
  org,
}: {
  org: Organization & {
    phone?: string
    email?: string
    website?: string
    instagram?: string
    facebook?: string
    specializations?: string[]
    opening_hours?: string
    openingHours?: string
    gallery?: string[]
    organization_socials?: OrganizationSocial[]
  }
}) {
  const socials = org.organization_socials ?? []
  const socialWebsite = socials.find((social) => social.platform === "website")?.url
  const socialInstagram = socials.find((social) => social.platform === "instagram")?.url
  const socialFacebook = socials.find((social) => social.platform === "facebook")?.url

  const website = org.website ?? socialWebsite
  const instagram = org.instagram ?? socialInstagram
  const facebook = org.facebook ?? socialFacebook

  return (
    <div className="space-y-5 lg:sticky lg:top-24 lg:space-y-6">

      {/* About */}
      <div className="space-y-3 rounded-2xl border border-border/60 p-4 sm:p-5">
        <h3 className="font-serif text-base font-light sm:text-lg">About</h3>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{org.description}</p>

        <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground sm:text-xs">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {org.opening_hours ?? org.openingHours}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {org.location}
        </div>
      </div>

      {/* Specializations */}
      <div className="space-y-3 rounded-2xl border border-border/60 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="font-serif text-base font-light sm:text-lg">Specializes In</h3>
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
      <div className="space-y-3 rounded-2xl border border-border/60 p-4 sm:p-5">
        <h3 className="font-serif text-base font-light sm:text-lg">Contact</h3>
        <div className="space-y-2.5">
          {(
            [
              { icon: Phone, label: org.phone, href: org.phone ? `tel:${org.phone}` : undefined },
              { icon: Mail, label: org.email, href: org.email ? `mailto:${org.email}` : undefined },
              {
                icon: Globe,
                label: website,
                href: website
                  ? website.startsWith("http")
                    ? website
                    : `https://${website}`
                  : undefined,
              },
              {
                icon: Camera,
                label: instagram,
                href: instagram
                  ? `https://instagram.com/${instagram.replace("@", "")}`
                  : undefined,
              },
              { icon: Users, label: facebook, href: facebook ? `https://facebook.com/${facebook}` : undefined },
            ]
          )
            .filter((c) => c.label)
            .map(({ icon: Icon, label, href }) => (
              <a
                key={String(label)}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground sm:text-xs"
              >
                <Icon className="w-3.5 h-3.5 shrink-0 group-hover:text-primary transition-colors" />
                <span className="truncate">{label}</span>
              </a>
            ))}
        </div>
      </div>
    </div>
  )
}