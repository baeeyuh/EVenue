import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const amenities = [
  "Parking",
  "Stage",
  "Catering",
  "AV System",
  "WiFi",
  "Rooftop",
  "Garden",
  "Heritage",
  "Pool",
]

export default function FilterSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-10">
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Search
            </label>
            <Input
              placeholder="Venue name or location"
              className="h-12 rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Min Capacity
            </label>
            <Input
              type="number"
              placeholder="e.g. 100"
              className="h-12 rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Max Budget
            </label>
            <Input
              type="number"
              placeholder="e.g. 50000"
              className="h-12 rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Location
            </label>
            <Select>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="cdo">Cagayan de Oro</SelectItem>
                <SelectItem value="iligan">Iligan</SelectItem>
                <SelectItem value="bukidnon">Bukidnon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {amenities.map((item, index) => (
            <Badge
              key={item}
              variant={index === 0 ? "default" : "secondary"}
              className="rounded-full px-4 py-2 text-sm"
            >
              {item}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  )
}