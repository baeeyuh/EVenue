export type InquiryStatus = "pending" | "accepted" | "rejected"

export type BookingStatus = "confirmed" | "cancelled"

export type Inquiry = {
  id: string
  venue_id: string
  client_id: string
  owner_id: string | null
  date: string
  pax: number | null
  message: string
  status: InquiryStatus
  created_at: string | null
  venue_name: string
  client_name?: string | null
  client_email?: string | null
}

export type Booking = {
  id: string
  inquiry_id: string
  venue_id: string
  client_id: string
  owner_id: string | null
  status: BookingStatus
  created_at: string | null
}

export type InquiryCreateInput = {
  venueId: string
  fullName: string
  email: string
  eventDate: string
  endDate?: string
  message: string
  contactNumber?: string
  eventType?: string
  guestCount?: number
  startTime?: string
  endTime?: string
}
