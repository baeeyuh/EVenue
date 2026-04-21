export type Venue = {
  id: string
  organization_id: string
  name: string
  location: string
  capacity: number
  price: number
  image: string
  amenities: string[]
  rating?: number
  review_count?: number
  owner_name?: string
  owner_initials?: string
  description?: string
  additionalInfo?: string
  venue_type?: string
  is_available?: boolean
}

export type Organization = {
  id: string
  name: string
  logo: string
  cover_image: string
  location: string
  description: string
  venue_count: number
  rating?: number
  review_count?: number
  phone?: string
  email?: string
  website?: string
  instagram?: string
  facebook?: string
  specializations?: string[]
  opening_hours?: string
  established?: string
  gallery?: string[]
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