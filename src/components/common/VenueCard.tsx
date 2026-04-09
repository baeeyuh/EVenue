import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

type VenueCardProps = {
  id: string
  name: string
  location: string
  capacity: number
  price: string
  image: string
  amenities: string[]
}

export default function VenueCard({
  id,
  name,
  location,
  capacity,
  price,
  image,
  amenities,
}: VenueCardProps) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-64 w-full">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
      </div>

      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight">{name}</h3>
          <p className="text-sm text-muted-foreground">{location}</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Capacity: {capacity} pax</span>
          <span className="font-semibold text-primary">{price}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {amenities.map((item) => (
            <Badge key={item} variant="secondary" className="rounded-full">
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button asChild className="w-full rounded-full">
          <Link href={`/venues/${id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}