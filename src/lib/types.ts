export type Venue = {
  id: string
  organizationId: string
  name: string
  location: string
  capacity: number
  price: string
  image: string
  amenities: string[]
  rating?: number
  reviewCount?: number
  ownerName?: string
  ownerInitials?: string
  description?: string
  venueType?: string
  isAvailable?: boolean
}

export type Organization = {
  id: string
  name: string
  logo: string
  coverImage: string
  location: string
  description: string
  venueCount: number
}

export type Booking = {
  id: string
  venueName: string
  eventDate: string
  status: "Pending" | "Confirmed" | "Cancelled"
}

export type Inquiry = {
  id: string
  organizationName: string
  message: string
  status: "Pending" | "Replied"
}