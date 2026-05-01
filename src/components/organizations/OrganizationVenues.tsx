import VenueCard from "@/components/common/VenueCard"

type VenueLike = {
  id: string
  organization_id?: string
  organizationId?: string
  name: string
  location: string
  capacity: number
  price: number | string
  image: string
  amenities?: string[]
  rating?: number
  review_count?: number
  reviewCount?: number
  owner_name?: string
  ownerName?: string
  owner_initials?: string
  ownerInitials?: string
  description?: string
  additional_info?: string
  additionalInfo?: string
  venue_type?: string
  venueType?: string
  is_available?: boolean
  isAvailable?: boolean
  check_in_time?: string | null
  checkInTime?: string
  check_out_time?: string | null
  checkOutTime?: string
  allow_custom_hours?: boolean | null
  allowCustomHours?: boolean
  allow_half_day?: boolean | null
  allowHalfDay?: boolean
  hourly_rate?: number | null
  hourlyRate?: number | null
  half_day_price?: number | null
  halfDayPrice?: number | null
}

export default function OrganizationVenues({ venues }: { venues: VenueLike[] }) {
  if (!venues.length) return null

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-light">Venues</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {venues.map((v) => (
          <VenueCard
            key={v.id}
            id={v.id}
            organizationId={v.organization_id ?? v.organizationId ?? ""}
            name={v.name}
            location={v.location}
            capacity={v.capacity}
            price={typeof v.price === "number" ? `₱${Number(v.price).toLocaleString()}` : v.price}
            image={v.image}
            amenities={v.amenities ?? []}
            rating={v.rating ?? 0}
            reviewCount={v.review_count ?? v.reviewCount ?? 0}
            ownerName={v.owner_name ?? v.ownerName ?? ""}
            ownerInitials={v.owner_initials ?? v.ownerInitials ?? ""}
            description={v.description}
            additionalInfo={v.additional_info ?? v.additionalInfo}
            venueType={v.venue_type ?? v.venueType}
            isAvailable={v.is_available ?? v.isAvailable ?? true}
            checkInTime={v.check_in_time ?? v.checkInTime}
            checkOutTime={v.check_out_time ?? v.checkOutTime}
            allowCustomHours={v.allow_custom_hours ?? v.allowCustomHours ?? false}
            allowHalfDay={v.allow_half_day ?? v.allowHalfDay ?? false}
            hourlyRate={v.hourly_rate ?? v.hourlyRate}
            halfDayPrice={v.half_day_price ?? v.halfDayPrice}
          />
        ))}
      </div>
    </div>
  )
}
