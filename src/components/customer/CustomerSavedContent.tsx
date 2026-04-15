import { Button } from "@/components/ui/button"

const savedItems = [
  {
    name: "The Glasshouse Pavilion",
    type: "Venue",
    location: "Cagayan de Oro City",
  },
  {
    name: "Golden Arch Events",
    type: "Organization",
    location: "Misamis Oriental",
  },
]

export default function CustomerSavedContent() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-primary">Saved</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Saved Items</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Keep track of venues and organizations you want to revisit later.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {savedItems.map((item) => (
            <div
              key={item.name}
              className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {item.type}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{item.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.location}</p>

              <div className="mt-5 flex gap-3">
                <Button variant="outline" className="rounded-full">
                  View
                </Button>
                <Button variant="ghost" className="rounded-full">
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}