import FeaturedOrganizations from "@/components/common/FeaturedOrganizations"
import FeaturedVenues from "@/components/common/FeaturedVenues"
import FilterSection from "@/components/common/FilterSection"
import HeroSection from "@/components/common/HeroSection"
import NavBar from "@/components/common/NavBar"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <NavBar />
      <HeroSection />
      <FilterSection />
      <FeaturedVenues />
      <FeaturedOrganizations />
    </main>
  )
}