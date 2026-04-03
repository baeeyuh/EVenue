import NavBar from "@/components/common/NavBar"
import HeroSection from "@/components/common/HeroSection"
import FilterSection from "@/components/common/FilterSection"
import FeaturedVenues from "@/components/common/FeaturedVenues"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <NavBar />
      <HeroSection />
      <FilterSection />
      <FeaturedVenues />
    </main>
  )
}