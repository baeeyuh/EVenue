import { Booking, Inquiry, Organization, Venue } from "@/lib/types"

export const venues = [
  {
    id: "v1",
    organizationId: "o1",
    name: "Glasshaus Events Place",
    location: "Cagayan de Oro City",
    capacity: 180,
    price: "₱45,000",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Parking", "WiFi", "Stage"],
  },
  {
    id: "v2",
    organizationId: "o2",
    name: "Azure Hall",
    location: "Iligan City",
    capacity: 250,
    price: "₱60,000",
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Catering", "AV System", "Garden"],
  },
  {
    id: "v3",
    organizationId: "o3",
    name: "Solmere Pavilion",
    location: "Bukidnon",
    capacity: 320,
    price: "₱75,000",
    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
    amenities: ["Pool", "Rooftop", "Parking"],
  },
]

export const organizations = [
  {
    id: "o1",
    name: "Luna Events Studio",
    logo:
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80",
    location: "Cagayan de Oro City",
    description:
      "Curated venues for intimate gatherings, debuts, and modern celebrations.",
    venueCount: 3,
  },
]

export const userInquiries: Inquiry[] = [
  {
    id: "i1",
    organizationName: "Luna Events Studio",
    message: "Is the venue available for 150 guests?",
    status: "Pending",
  },
  {
    id: "i2",
    organizationName: "Azure Gatherings",
    message: "Do you allow outside catering?",
    status: "Replied",
  },
]