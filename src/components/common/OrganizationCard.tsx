import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

type OrganizationCardProps = {
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
  return (
    <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-56 w-full">
        <Image
            src={logo}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
            />
      </div>

      <CardContent className="space-y-3 p-5">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{name}</h3>
          <p className="text-sm text-muted-foreground">{location}</p>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        <p className="text-sm font-medium">{venueCount} venues available</p>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link href={`/organizations/${id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}