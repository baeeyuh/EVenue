export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="h-12 w-1/3 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </section>
    </main>
  )
}
