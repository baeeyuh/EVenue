import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const inquiries = [
  {
    id: "INQ-2101",
    venue: "Celestine Events Place",
    date: "April 18, 2026",
    status: "Awaiting Response",
  },
  {
    id: "INQ-2102",
    venue: "Aurelia Garden Suites",
    date: "April 21, 2026",
    status: "Responded",
  },
]

export default function ClientInquiriesContent() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-primary">My Inquiries</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Inquiries</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Track venue questions, availability requests, and communication status.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {inquiry.id}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{inquiry.venue}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Inquiry Date: {inquiry.date}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{inquiry.status}</Badge>
                  <Button variant="outline" className="rounded-full">
                    View Inquiry
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
