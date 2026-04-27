export type DetailRole = "client" | "owner"

export type DetailMessage = {
  id: string
  message: string
  sender_role: DetailRole
  created_at: string
}

export type DetailVenue = {
  id: string | null
  name: string
  location: string | null
  price: number | null
  capacity?: number | null
  venue_type?: string | null
  description?: string | null
  additional_info?: string | null
  image?: string | null
  is_available?: boolean | null
  amenities?: string[] | null
  rating?: number | null
  review_count?: number | null
}

export type DetailPerson = {
  id: string | null
  name: string
  email: string | null
}

export type InquiryDetails = {
  id: string
  date: string | null
  pax: number | null
  status: string | null
  created_at: string | null
  venue: DetailVenue
  client: DetailPerson
  owner: DetailPerson
  messages: DetailMessage[]
}

export type BookingDetails = {
  id: string
  code: string | null
  status: string | null
  created_at: string | null
  event_date: string | null
  start_date: string | null
  end_date: string | null
  guest_count: number | null
  price: number | null
  venue: DetailVenue
  client: DetailPerson
  owner: DetailPerson
  inquiry: InquiryDetails | null
}
