"use client"
import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { organizations } from "@/lib/mock-data"
import OrganizationCard from "@/components/common/OrganizationCard"

export default function OrganizationsPage() {
  const [search, setSearch] = useState("")

  const filtered = organizations.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Explore</p>
        <h1 className="font-serif text-4xl font-light mt-1 mb-8">Organizations</h1>

        {/* Search */}
        <div className="relative max-w-sm mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-2xl border-border/60 bg-background pl-10 text-sm"
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-16">
        <p className="text-xs text-muted-foreground mb-6">{filtered.length} organizations found</p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-muted-foreground">No organizations found for "{search}"</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((org) => (
              <OrganizationCard key={org.id} {...org} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}